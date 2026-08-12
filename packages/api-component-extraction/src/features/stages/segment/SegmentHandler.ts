import { Result } from "@webiny/feature/api";
import { StageHandler, type StageContext, type StageOutcome } from "~/domain/stage.js";
import type {
    CapturedNode,
    CaptureArtifact,
    SegmentArtifact,
    SegmentedPage
} from "~/domain/artifacts.js";
import { detectSections } from "./boundaries.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";

const MIN_SECTION_HEIGHT = 120;
const MIN_WIDTH_RATIO = 0.5;
const DESKTOP_WIDTH = 1440;

/**
 * Segment — deterministic, offline, no browser. Reads each captured page's pruned tree from S3 and
 * detects candidate section boundaries as boxes into that page's full-page screenshot.
 */
class SegmentHandlerImpl implements StageHandler.Interface {
    readonly stage = "segment" as const;

    async execute(context: StageContext): Promise<Result<StageOutcome, ExtractionError>> {
        const captureRef = context.upstream.pages;
        if (!captureRef) {
            return Result.fail(new ExtractionValidationError("no captured pages to segment"));
        }
        const captureResult = await context.store.getJson<CaptureArtifact>(captureRef);
        if (captureResult.isFail()) {
            return Result.fail(captureResult.error);
        }
        const capture = captureResult.value;
        if (!capture) {
            return Result.fail(new ExtractionValidationError("the capture artifact is empty"));
        }

        const total = capture.pages.length;
        await context.progress({ message: `Segmenting ${total} captured page(s)…` });

        const pages: SegmentedPage[] = [];
        let totalSections = 0;

        for (let index = 0; index < total; index++) {
            const page = capture.pages[index];
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

            const sections = detectSections(tree, {
                minHeight: MIN_SECTION_HEIGHT,
                minWidthRatio: MIN_WIDTH_RATIO,
                viewportWidth: DESKTOP_WIDTH
            });
            totalSections += sections.length;
            pages.push({
                url: page.url,
                screenshotRef: page.screenshotRef,
                treeRef: page.treeRef,
                documentHeight: page.documentHeight,
                sections
            });
            await context.progress({
                message: `Segmented ${index + 1}/${total} page(s)`,
                current: index + 1,
                total
            });
        }

        const artifact: SegmentArtifact = { pages };
        const key = context.artifactKey("sections");
        const written = await context.store.putJson(key, artifact);
        if (written.isFail()) {
            return Result.fail(written.error);
        }

        await context.log.info({
            message: `Segmented ${pages.length} page(s) into ${totalSections} section(s).`
        });
        return Result.ok({ artifacts: { sections: key }, counts: { sections: totalSections } });
    }
}

export const SegmentHandler = StageHandler.createImplementation({
    implementation: SegmentHandlerImpl,
    dependencies: []
});
