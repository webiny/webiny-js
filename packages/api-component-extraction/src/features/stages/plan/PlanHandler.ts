import { Result } from "@webiny/feature/api";
import type { ThemeManifest } from "@webiny/theme-common";
import { StageHandler, type StageContext, type StageOutcome } from "~/domain/stage.js";
import type {
    CapturedNode,
    ClassifyArtifact,
    PlanArtifact,
    PlannedComponent,
    SegmentArtifact
} from "~/domain/artifacts.js";
import { ComponentExtractionAi } from "~/features/shared/ai.js";
import { ThemeManifestResolver } from "~/features/shared/themeManifest.js";
import { hasNothingToGenerate } from "./hasNothingToGenerate.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";
import { PLAN_SYSTEM, buildPlanPrompt, parsePlanContract } from "./planContract.js";
import { coverMemberTexts } from "./textCoverage.js";
import { bindObservedValues } from "./bindObservedValues.js";
import { sectionBackgroundImages } from "./sectionBackgroundImages.js";
import { sectionTextAlignment } from "./sectionTextAlignment.js";
import { sectionTypeScale } from "./sectionTypeScale.js";
import { findNodeByBox } from "../cluster/sectionNode.js";
import { stageEntry } from "~/domain/ledger.js";
import { referenceTexts } from "./referenceTexts.js";

// One model call per cluster. The margin MUST exceed one call's worst case: the timeout is checked only
// between clusters, so too small a margin lets a call start without runway and the Lambda is hard-killed
// mid-call, leaving the stage stuck "running".
const PLAN_SAFETY_MARGIN_SECONDS = 180;

/*
 * How many of a cluster's sections are read for their non-text values. Bounded because a navigation
 * cluster can carry one member per page; past a dozen the values repeat and only the artifact grows.
 */
const MAX_MEMBERS_HARVESTED = 12;

/** Resumable checkpoint: how far through the clusters we are, and the planned components so far. */
interface PlanCheckpoint {
    nextIndex: number;
    components: PlannedComponent[];
}

/**
 * Plan — model-backed. For each cluster, proposes a component contract: props (name, type, observed
 * values) and token bindings resolved against the theme manifest. This is the gate where cost starts,
 * so the run records the resulting component count. A missing provider fails the stage; a per-component
 * model error skips that component.
 */
class PlanHandlerImpl implements StageHandler.Interface {
    readonly stage = "plan" as const;

    constructor(
        private ai: ComponentExtractionAi.Interface,
        private manifestResolver: ThemeManifestResolver.Interface
    ) {}

    async execute(context: StageContext): Promise<Result<StageOutcome, ExtractionError>> {
        const classifyRef = context.upstream.classifications;
        if (!classifyRef) {
            return Result.fail(new ExtractionValidationError("no classified clusters to plan"));
        }
        const classifyResult = await context.store.getJson<ClassifyArtifact>(classifyRef);
        if (classifyResult.isFail()) {
            return Result.fail(classifyResult.error);
        }
        const classify = classifyResult.value;
        if (!classify) {
            return Result.fail(new ExtractionValidationError("the classify artifact is empty"));
        }

        /*
         * The sections, so a component's non-text props can be filled from the section its reference
         * image was cropped from. Optional on purpose: without it Plan still produces a contract, just
         * one whose image and link props arrive empty — which is what it did before. A missing segment
         * artifact should not fail a stage that can still do most of its job.
         */
        /*
         * Read from the run's ledger, not from `context.upstream`: that holds only the IMMEDIATELY
         * previous stage's artifacts, so for Plan it is Classify's and `upstream.sections` is always
         * undefined. The first version of this used it, found nothing, and — being written to carry on
         * without the sections — bound nothing at all while reporting success.
         */
        const segmentRef = stageEntry(context.run.stages, "segment")?.artifacts?.sections;
        let segment: SegmentArtifact | null = null;
        if (segmentRef) {
            const segmentResult = await context.store.getJson<SegmentArtifact>(segmentRef);
            if (segmentResult.isOk()) {
                segment = segmentResult.value;
            }
        }
        if (!segment) {
            // Said out loud. A silent skip here is what hid the defect above.
            await context.log.error({
                message:
                    "No segment artifact reachable from the ledger: image, link and list props will be planned with no observed values."
            });
        }
        const segmentByUrl = new Map((segment?.pages ?? []).map(page => [page.url, page]));
        // One page tree is read per cluster at most, and reference sections often share a page.
        const treeCache = new Map<string, CapturedNode | null>();

        const referenceSection = async (
            url: string,
            sectionIndex: number
        ): Promise<CapturedNode | null> => {
            const page = segmentByUrl.get(url);
            const section = page?.sections.find(candidate => candidate.index === sectionIndex);
            if (!page || !section) {
                return null;
            }
            if (!treeCache.has(page.treeRef)) {
                const blob = await context.blobs.get(page.treeRef);
                let tree: CapturedNode | null = null;
                if (blob.isOk()) {
                    try {
                        tree = JSON.parse(new TextDecoder().decode(blob.value)) as CapturedNode;
                    } catch {
                        tree = null;
                    }
                }
                treeCache.set(page.treeRef, tree);
            }
            const tree = treeCache.get(page.treeRef) ?? null;
            return tree ? findNodeByBox(tree, section.box) : null;
        };

        let manifest: ThemeManifest | null = null;
        const manifestResult = await this.manifestResolver.resolve(
            context.job.themeEntryId,
            context.job.themeVersion
        );
        if (manifestResult.isOk()) {
            manifest = manifestResult.value;
        } else {
            await context.log.info({
                message: `Planning without token bindings: ${manifestResult.error.message}`
            });
        }

        /*
         * A cluster with no text, no images and no destinations has nothing to build a component
         * from. Dropped here rather than later because Plan is where cost starts: planning and then
         * generating an empty container spends two model calls to produce something that arrives in
         * the customer's library as "Empty Container / Spacer".
         */
        const emptyClusters = classify.clusters.filter(entry =>
            hasNothingToGenerate(entry.cluster)
        );
        const clusters = classify.clusters.filter(entry => !hasNothingToGenerate(entry.cluster));
        const total = clusters.length;

        for (const entry of emptyClusters) {
            await context.log.info({
                message: `Skipping "${entry.name}": the section carries no text, images or links.`
            });
        }

        // Resume from the checkpoint if this is a continuation; start fresh otherwise.
        const checkpointKey = context.artifactKey("checkpoint");
        const loaded = await context.store.getJson<PlanCheckpoint>(checkpointKey);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const checkpoint: PlanCheckpoint = loaded.value ?? { nextIndex: 0, components: [] };

        while (checkpoint.nextIndex < total) {
            const cluster = clusters[checkpoint.nextIndex];
            const aiResult = await this.ai.generate({
                system: PLAN_SYSTEM,
                messages: [{ role: "user", content: buildPlanPrompt(cluster, manifest) }]
            });
            if (aiResult.isFail()) {
                if (aiResult.error.code === "ComponentExtraction/ValidationError") {
                    return Result.fail(aiResult.error);
                }
                await context.log.error({
                    message: `Plan failed for "${cluster.name}": ${aiResult.error.message}`
                });
            } else {
                const contract = parsePlanContract(
                    aiResult.value,
                    cluster.cluster.members.length,
                    cluster.cluster.observedTexts
                );
                if (!contract) {
                    await context.log.error({
                        message: `Plan returned no usable contract for "${cluster.name}".`
                    });
                } else {
                    /*
                     * Fill the non-text props from the reference section before anything reads the
                     * contract. Ordering matters twice: the coverage check below counts a member text
                     * as held only if some prop observed it, and a link label only becomes an observed
                     * value here; and Generate is handed these values so it has something real to put
                     * in the component's defaults instead of inventing a stock photograph.
                     */
                    /*
                     * Every member's section, representative first.
                     *
                     * `observedValues` means "observed across the cluster's members", and the texts a
                     * prop most needs to hold are the ones the representative does not have — another
                     * page's navigation labels are not in this page's navigation. Representative first
                     * so the positional rule gives the section the reference image shows the first
                     * claim on each prop.
                     */
                    const members = [
                        cluster.cluster.representative,
                        ...cluster.cluster.members.filter(
                            member =>
                                member.url !== cluster.cluster.representative.url ||
                                member.sectionIndex !== cluster.cluster.representative.sectionIndex
                        )
                    ].slice(0, MAX_MEMBERS_HARVESTED);

                    const nodes: CapturedNode[] = [];
                    for (const member of members) {
                        const resolved = await referenceSection(member.url, member.sectionIndex);
                        if (resolved) {
                            nodes.push(resolved);
                        }
                    }

                    /*
                     * The reference section's type scale — the first node, which is the
                     * representative. Taken here because the node is already resolved and walked for
                     * the value binding, so this costs one more pass over a subtree rather than
                     * another tree read.
                     */
                    const typeScale = nodes[0] ? sectionTypeScale(nodes[0], manifest) : [];
                    if (typeScale.length === 0 && nodes[0]) {
                        await context.log.info({
                            message: `No type scale read for "${cluster.name}": its reference section has no text-bearing elements.`
                        });
                    }

                    /* Same node, same pass, same reason: measured during capture and read by nothing. */
                    const textAlignments = nodes[0] ? sectionTextAlignment(nodes[0]) : [];
                    const backgroundImages = nodes[0] ? sectionBackgroundImages(nodes[0]) : [];
                    if (textAlignments.length === 0 && nodes[0]) {
                        await context.log.info({
                            message: `No text alignment read for "${cluster.name}": no text-bearing element of its reference section records one.`
                        });
                    }

                    if (nodes.length > 0) {
                        const bound = bindObservedValues(nodes, contract.props);
                        if (bound.propsBound > 0) {
                            await context.log.info({
                                message: `Filled ${bound.propsBound} non-text prop(s) of "${cluster.name}" from ${nodes.length} member section(s): ${bound.mediaBound} image(s), ${bound.linksBound} link(s), ${bound.itemsBound} list item(s).`
                            });
                        }
                    } else {
                        await context.log.error({
                            message: `No member section node resolved for "${cluster.name}" (${cluster.cluster.representative.url} section ${cluster.cluster.representative.sectionIndex}); its image and link props stay empty.`
                        });
                    }

                    checkpoint.components.push({
                        signature: cluster.cluster.signature,
                        name: cluster.name,
                        type: cluster.type,
                        props: contract.props,
                        tokenBindings: contract.tokenBindings,
                        representative: cluster.cluster.representative,
                        members: cluster.cluster.members,
                        representativeCrop: cluster.cluster.representativeCrop,
                        // What Generate must reproduce: the text of the member its reference image
                        // shows, not the union over the cluster. The union is kept beside it, and the
                        // obligation it used to carry is now checked against the props instead.
                        sourceTexts: referenceTexts(cluster.cluster),
                        clusterTexts: cluster.cluster.observedTexts,
                        typeScale,
                        textAlignments,
                        backgroundImages,
                        textCoverage: coverMemberTexts(cluster.cluster.members, contract.props)
                    });
                }
            }

            checkpoint.nextIndex++;
            await context.progress({
                message: `Planned ${checkpoint.nextIndex}/${total} sections`,
                current: checkpoint.nextIndex,
                total
            });
            const saved = await context.store.putJson(checkpointKey, checkpoint);
            if (saved.isFail()) {
                return Result.fail(saved.error);
            }

            if (
                checkpoint.nextIndex < total &&
                context.isCloseToTimeout(PLAN_SAFETY_MARGIN_SECONDS)
            ) {
                return Result.ok({
                    artifacts: {},
                    counts: { components: checkpoint.components.length },
                    more: true
                });
            }
        }

        const artifact: PlanArtifact = { components: checkpoint.components };
        const key = context.artifactKey("plan");
        const written = await context.store.putJson(key, artifact);
        if (written.isFail()) {
            return Result.fail(written.error);
        }

        await context.log.info({
            message: `Planned ${checkpoint.components.length} component(s).`
        });
        return Result.ok({
            artifacts: { plan: key },
            counts: { components: checkpoint.components.length }
        });
    }
}

export const PlanHandler = StageHandler.createImplementation({
    implementation: PlanHandlerImpl,
    dependencies: [ComponentExtractionAi, ThemeManifestResolver]
});
