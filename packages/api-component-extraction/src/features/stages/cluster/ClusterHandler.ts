import { Result } from "@webiny/feature/api";
import { StageHandler, type StageContext, type StageOutcome } from "~/domain/stage.js";
import type {
    CapturedNode,
    Cluster,
    ClusterArtifact,
    ClusterMember,
    RepresentativeCrop,
    SectionDigest,
    SegmentArtifact
} from "~/domain/artifacts.js";
import { ThemeManifestResolver } from "~/features/shared/themeManifest.js";
import { findContentRoot } from "~/features/stages/segment/boundaries.js";
import { structuralSignature } from "./signature.js";
import { buildTokenLookup, sectionShape, type TokenLookup } from "./sectionShape.js";
import { sectionDigest } from "./digest.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";

const DESKTOP_WIDTH = 1440;
const EMPTY_LOOKUP: TokenLookup = { colorHexToPath: new Map() };
const MAX_OBSERVED_TEXTS = 60;

type MemberEntry = { member: ClusterMember; digest: SectionDigest; crop: RepresentativeCrop };

/**
 * Cluster — deterministic. Fingerprints each section (structural signature over its type tree, geometry
 * class and resolved tokens) and groups matching sections across pages. The signature is load-bearing:
 * a cluster's identity must be stable so an override reattaches across runs.
 */
class ClusterHandlerImpl implements StageHandler.Interface {
    readonly stage = "cluster" as const;

    constructor(private manifestResolver: ThemeManifestResolver.Interface) {}

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

        const bySignature = new Map<string, MemberEntry[]>();
        let sectionCount = 0;

        for (const page of segment.pages) {
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

            const contentRoot = findContentRoot(tree);
            for (const section of page.sections) {
                const node = contentRoot.children[section.index];
                if (!node) {
                    continue;
                }
                const signature = structuralSignature(sectionShape(node, DESKTOP_WIDTH, lookup));
                const member: ClusterMember = {
                    url: page.url,
                    sectionIndex: section.index,
                    signature
                };
                const list = bySignature.get(signature) ?? [];
                list.push({
                    member,
                    digest: sectionDigest(node),
                    crop: { screenshotRef: page.screenshotRef, box: section.box }
                });
                bySignature.set(signature, list);
                sectionCount++;
            }
        }

        const clusters: Cluster[] = [...bySignature.values()].map(entries => ({
            signature: entries[0].member.signature,
            members: entries.map(entry => entry.member),
            representative: entries[0].member,
            digest: entries[0].digest,
            observedTexts: [...new Set(entries.flatMap(entry => entry.digest.texts))].slice(
                0,
                MAX_OBSERVED_TEXTS
            ),
            representativeCrop: entries[0].crop
        }));

        const artifact: ClusterArtifact = { clusters };
        const key = context.artifactKey("clusters");
        const written = await context.store.putJson(key, artifact);
        if (written.isFail()) {
            return Result.fail(written.error);
        }

        await context.log.info({
            message: `Clustered ${sectionCount} section(s) into ${clusters.length} cluster(s).`
        });
        return Result.ok({ artifacts: { clusters: key }, counts: { clusters: clusters.length } });
    }
}

export const ClusterHandler = StageHandler.createImplementation({
    implementation: ClusterHandlerImpl,
    dependencies: [ThemeManifestResolver]
});
