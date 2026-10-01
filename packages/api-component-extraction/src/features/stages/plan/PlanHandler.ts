import { Result } from "@webiny/feature/api";
import type { ThemeManifest } from "@webiny/theme-common";
import { StageHandler, type StageContext, type StageOutcome } from "~/domain/stage.js";
import type { ClassifyArtifact, PlanArtifact, PlannedComponent } from "~/domain/artifacts.js";
import { ComponentExtractionAi } from "~/features/shared/ai.js";
import { ThemeManifestResolver } from "~/features/shared/themeManifest.js";
import { hasNothingToGenerate } from "./hasNothingToGenerate.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";
import { PLAN_SYSTEM, buildPlanPrompt, parsePlanContract } from "./planContract.js";
import { coverMemberTexts } from "./textCoverage.js";

// One model call per cluster. The margin MUST exceed one call's worst case: the timeout is checked only
// between clusters, so too small a margin lets a call start without runway and the Lambda is hard-killed
// mid-call, leaving the stage stuck "running".
const PLAN_SAFETY_MARGIN_SECONDS = 180;

/**
 * The reference member's own text, in document order.
 *
 * Falls back to the cluster union when the representative has no digest texts — a section whose text
 * all sits on descendants the digest did not record. Emitting nothing there would tell the model to
 * reproduce a picture with no text at all, which is a worse instruction than the one being replaced.
 */
const representativeTexts = (cluster: {
    representative: { digest?: { texts?: string[] } };
    observedTexts: string[];
}): string[] => {
    const texts = (cluster.representative.digest?.texts ?? []).filter(
        (text): text is string => typeof text === "string"
    );
    return texts.length > 0 ? texts : cluster.observedTexts;
};

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
                        sourceTexts: representativeTexts(cluster.cluster),
                        clusterTexts: cluster.cluster.observedTexts,
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
