import { Result } from "@webiny/feature/api";
import { StageHandler, type StageContext, type StageOutcome } from "~/domain/stage.js";
import type {
    CapturedNode,
    Cluster,
    ClusterArtifact,
    ClusterMember,
    RepresentativeCrop,
    SectionDigest,
    SectionShape,
    SegmentArtifact,
    ThresholdCurvePoint
} from "~/domain/artifacts.js";
import { ThemeManifestResolver } from "~/features/shared/themeManifest.js";
import { OverrideRepository } from "~/domain/abstractions.js";
import { effectiveClusterThreshold } from "~/domain/overrides.js";
import { findNodeByBox } from "./sectionNode.js";
import { structuralSignature } from "./signature.js";
import { buildTokenLookup, sectionShape, type TokenLookup } from "./sectionShape.js";
import { sectionDigest } from "./digest.js";
import { clusterCountAt, leaderCluster, nearestPairSimilarity } from "./similarity.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";

const DESKTOP_WIDTH = 1440;
const EMPTY_LOOKUP: TokenLookup = { colorHexToPath: new Map() };
const MAX_OBSERVED_TEXTS = 60;
// The default grouping strictness — a section joins a cluster when it's at least this similar to the
// cluster's representative. 1.0 is exact-structural match; lower groups near-identical sections.
const DEFAULT_THRESHOLD = 0.85;
// The thresholds the count curve is sampled at, so the slider previews the count without re-clustering.
const THRESHOLD_GRID = [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1];

type MemberEntry = {
    member: ClusterMember;
    digest: SectionDigest;
    crop: RepresentativeCrop;
    shape: SectionShape;
};

/**
 * Cluster — deterministic. Fingerprints each section (type tree, geometry class, resolved tokens) and
 * groups sections by graded SIMILARITY at a threshold (leader clustering), not exact-signature matching —
 * so near-identical sections group and the threshold is tunable (W8.3). Each section still carries its
 * structural signature (its stable identity), so a cluster's representative signature reattaches an
 * override across runs. The artifact carries the threshold used, the nearest-pair similarity and a
 * count-vs-threshold curve for the slider.
 */
class ClusterHandlerImpl implements StageHandler.Interface {
    readonly stage = "cluster" as const;

    constructor(
        private manifestResolver: ThemeManifestResolver.Interface,
        private overrides: OverrideRepository.Interface
    ) {}

    async execute(context: StageContext): Promise<Result<StageOutcome, ExtractionError>> {
        const segmentRef = context.upstream.sections;
        if (!segmentRef) {
            return Result.fail(new ExtractionValidationError("no segmented pages to cluster"));
        }
        const segmentResult = await context.store.getJson<SegmentArtifact>(segmentRef);
        if (segmentResult.isFail()) {
            return Result.fail(segmentResult.error);
        }
        const segment = segmentResult.value;
        if (!segment) {
            return Result.fail(new ExtractionValidationError("the segment artifact is empty"));
        }

        // Resolve the pinned theme's manifest for token binding. A missing or unpublished theme degrades
        // to no token resolution — the signature still discriminates on structure and geometry.
        let lookup = EMPTY_LOOKUP;
        const manifest = await this.manifestResolver.resolve(
            context.job.themeEntryId,
            context.job.themeVersion
        );
        if (manifest.isOk()) {
            lookup = buildTokenLookup(manifest.value);
        } else {
            await context.log.info({
                message: `Clustering without token resolution: ${manifest.error.message}`
            });
        }

        // The effective similarity threshold: a `cluster.threshold` parameter override, else the default.
        const overridesResult = await this.overrides.listByJob(context.job.id);
        const threshold = overridesResult.isOk()
            ? effectiveClusterThreshold(overridesResult.value, DEFAULT_THRESHOLD)
            : DEFAULT_THRESHOLD;

        const total = segment.pages.length;
        await context.progress({
            message: `Clustering sections across ${total} page(s) at ${Math.round(threshold * 100)}% similarity…`
        });

        // Fingerprint every section first, then cluster — leader clustering compares each section to the
        // representatives, so it needs the whole set, not a per-signature bucket.
        const entries: MemberEntry[] = [];

        for (let index = 0; index < total; index++) {
            const page = segment.pages[index];
            const treeResult = await context.blobs.get(page.treeRef);
            if (treeResult.isFail()) {
                await context.log.error({ message: `Could not read the tree for ${page.url}.` });
                continue;
            }
            let tree: CapturedNode;
            try {
                tree = JSON.parse(new TextDecoder().decode(treeResult.value)) as CapturedNode;
            } catch {
                await context.log.error({ message: `Malformed tree for ${page.url}.` });
                continue;
            }

            for (const section of page.sections) {
                // Resolve the section back to its node by its box, not by tree position — a section may
                // be nested well below the content root, so `contentRoot.children[index]` missed it.
                const node = findNodeByBox(tree, section.box);
                if (!node) {
                    await context.log.error({
                        message: `No node matched section ${section.index} of ${page.url}; skipping.`
                    });
                    continue;
                }
                const shape = sectionShape(node, DESKTOP_WIDTH, lookup);
                const digest = sectionDigest(node);
                const member: ClusterMember = {
                    url: page.url,
                    sectionIndex: section.index,
                    signature: structuralSignature(shape),
                    cropRef: section.cropRef,
                    // Carried per member so a W8 split/move override can promote it to a representative.
                    digest,
                    screenshotRef: page.screenshotRef,
                    box: section.box
                };
                entries.push({
                    member,
                    digest,
                    shape,
                    crop: {
                        screenshotRef: page.screenshotRef,
                        box: section.box,
                        cropRef: section.cropRef
                    }
                });
            }
            await context.progress({
                message: `Fingerprinted ${index + 1}/${total} page(s)`,
                current: index + 1,
                total
            });
        }

        const groups = leaderCluster(entries, entry => entry.shape, threshold);
        const clusters: Cluster[] = groups.map(group => ({
            signature: group[0].member.signature,
            members: group.map(entry => entry.member),
            representative: group[0].member,
            digest: group[0].digest,
            observedTexts: [...new Set(group.flatMap(entry => entry.digest.texts))].slice(
                0,
                MAX_OBSERVED_TEXTS
            ),
            representativeCrop: group[0].crop
        }));

        // The count-vs-threshold curve (for the slider) and the nearest-pair similarity (how close the two
        // closest clusters are), so the operator can tune the threshold without re-running each step.
        const shapes = entries.map(entry => entry.shape);
        const thresholdCurve: ThresholdCurvePoint[] = THRESHOLD_GRID.map(point => ({
            threshold: point,
            clusters: clusterCountAt(shapes, point)
        }));
        const nearestPair = nearestPairSimilarity(groups.map(group => group[0].shape));

        const artifact: ClusterArtifact = { clusters, threshold, nearestPair, thresholdCurve };
        const key = context.artifactKey("clusters");
        const written = await context.store.putJson(key, artifact);
        if (written.isFail()) {
            return Result.fail(written.error);
        }

        await context.log.info({
            message: `Clustered ${entries.length} section(s) into ${clusters.length} cluster(s) at ${Math.round(threshold * 100)}% similarity.`
        });
        return Result.ok({ artifacts: { clusters: key }, counts: { clusters: clusters.length } });
    }
}

export const ClusterHandler = StageHandler.createImplementation({
    implementation: ClusterHandlerImpl,
    dependencies: [ThemeManifestResolver, OverrideRepository]
});
