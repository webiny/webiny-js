import { Result } from "@webiny/feature/api";
import { StageHandler, type StageContext, type StageOutcome } from "~/domain/stage.js";
import type {
    CapturedNode,
    CaptureArtifact,
    SectionBox,
    SegmentArtifact,
    SegmentedPage
} from "~/domain/artifacts.js";
import { detectSections } from "./boundaries.js";
import { cropFromScreenshot } from "~/features/shared/imageCrop.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";

const MIN_SECTION_HEIGHT = 120;
const MIN_WIDTH_RATIO = 0.5;
const DESKTOP_WIDTH = 1440;
// Section crops serve both the cluster gallery and the model reference image. Width and height are
// capped independently so a tall section keeps its full horizontal detail (a single edge cap would
// crush a tall crop's width): the width cap sits above the 1440 capture so a full-width section is kept
// intact, and the height cap bounds an unusually tall section for the model image.
const CROP_MAX_WIDTH = 1600;
const CROP_MAX_HEIGHT = 4000;

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

            const detected = detectSections(tree, {
                minHeight: MIN_SECTION_HEIGHT,
                minWidthRatio: MIN_WIDTH_RATIO,
                viewportWidth: DESKTOP_WIDTH
            });

            // Crop each section from the page's full-page screenshot, once, so downstream views and
            // Generate reuse a stored image rather than re-cropping. Keyed with the stage version so a
            // Segment re-run's crops never mix with the previous version's.
            const screenshot = await context.blobs.get(page.screenshotRef);
            const sections: SectionBox[] = [];
            for (const section of detected) {
                let cropRef = "";
                if (screenshot.isOk()) {
                    try {
                        const cropped = await cropFromScreenshot(
                            screenshot.value,
                            section.box,
                            DESKTOP_WIDTH,
                            CROP_MAX_WIDTH,
                            CROP_MAX_HEIGHT
                        );
                        const stored = await context.blobs.put(
                            `${context.run.id}/segment/v${context.stageVersion}/${index}/section-${section.index}.png`,
                            cropped,
                            "image/png"
                        );
                        if (stored.isOk()) {
                            cropRef = stored.value;
                        }
                    } catch (error) {
                        await context.log.error({
                            message: `Could not crop section ${section.index} of ${page.url}.`,
                            error
                        });
                    }
                }
                sections.push({ ...section, cropRef });
            }

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
