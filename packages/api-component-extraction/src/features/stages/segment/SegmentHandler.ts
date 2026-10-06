import { Result } from "@webiny/feature/api";
import { StageHandler, type StageContext, type StageOutcome } from "~/domain/stage.js";
import type {
    CapturedNode,
    CaptureArtifact,
    CropWarning,
    SectionBox,
    SegmentArtifact,
    SegmentedPage
} from "~/domain/artifacts.js";
import { detectSections } from "./boundaries.js";
import { cropFromScreenshot, type SectionCropPlan } from "~/features/shared/imageCrop.js";
import { OverrideRepository } from "~/domain/abstractions.js";
import { effectiveMaxSectionHeight } from "~/domain/overrides.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";

const MIN_SECTION_HEIGHT = 120;
const MIN_WIDTH_RATIO = 0.5;
const DESKTOP_WIDTH = 1440;
/*
 * A near-full-width block taller than this that is a vertical stack of several full-width children is a
 * container to split into those children, not one section — so a page-wrapping <main>/content <div>
 * can't swallow the whole page as a single giant block.
 *
 * This is the default, not a constant: it is overridable per run, because it is the one number that
 * decides whether two logical blocks stay merged. Measured across 11 real pages on two sites, every
 * under-split section was held together by this gate alone and by nothing else. At 1600 an entire page
 * could come back as a single section carrying its own header, hero and footer, which costs far more
 * than a section too many: a page that is one section contributes no footer to clustering at all.
 *
 * 900 rather than lower because the gains plateau just below it — dropping to 700 adds four sections
 * across those pages and splits a 713px footer whose single-component shape is already validated.
 */
const DEFAULT_MAX_SECTION_HEIGHT = 900;
const MIN_CHILDREN_TO_SPLIT = 2;
// Section crops serve both the cluster gallery and the model reference image, at true scale. Only a
// section taller than this is shrunk (uniformly, with the scale recorded): 8000px is the largest image
// dimension model providers accept, and a section that tall is a page that failed to split.
const CROP_MAX_HEIGHT = 8000;

/** What a crop plan says about the crop, as a warning — none when the whole box was in the picture. */
const cropWarningOf = (plan: SectionCropPlan): CropWarning | undefined => {
    if (plan.status === "ok") {
        return undefined;
    }
    return {
        kind: plan.status === "outside" ? "outside-screenshot" : "partially-outside",
        visibleFraction: Math.round(plan.visibleFraction * 1000) / 1000
    };
};

/**
 * Segment — deterministic, offline, no browser. Reads each captured page's pruned tree from S3 and
 * detects candidate section boundaries as boxes into that page's full-page screenshot.
 */
class SegmentHandlerImpl implements StageHandler.Interface {
    readonly stage = "segment" as const;

    constructor(private overrides: OverrideRepository.Interface) {}

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

        // The effective container height: a `segment.maxSectionHeight` parameter override, else the default.
        const overridesResult = await this.overrides.listByJob(context.job.id);
        const maxSectionHeight = overridesResult.isOk()
            ? effectiveMaxSectionHeight(overridesResult.value, DEFAULT_MAX_SECTION_HEIGHT)
            : DEFAULT_MAX_SECTION_HEIGHT;

        const total = capture.pages.length;
        await context.progress({
            message: `Segmenting ${total} captured page(s) at a ${maxSectionHeight}px container height…`
        });

        const pages: SegmentedPage[] = [];
        let totalSections = 0;
        let croppingWarnings = 0;

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
                viewportWidth: DESKTOP_WIDTH,
                maxSectionHeight,
                minChildrenToSplit: MIN_CHILDREN_TO_SPLIT
            });

            // Crop each section from the page's full-page screenshot, once, so downstream views and
            // Generate reuse a stored image rather than re-cropping. Keyed with the stage version so a
            // Segment re-run's crops never mix with the previous version's.
            const screenshot = await context.blobs.get(page.screenshotRef);
            const sections: SectionBox[] = [];
            for (const section of detected) {
                let cropRef = "";
                let cropScale = 1;
                let cropWarning: CropWarning | undefined = screenshot.isOk()
                    ? undefined
                    : { kind: "no-screenshot", visibleFraction: 0 };
                if (screenshot.isOk()) {
                    try {
                        const cropped = await cropFromScreenshot(
                            screenshot.value,
                            section.box,
                            DESKTOP_WIDTH,
                            CROP_MAX_HEIGHT
                        );
                        cropWarning = cropWarningOf(cropped.plan);
                        cropScale = cropped.scale;
                        if (cropped.image) {
                            const stored = await context.blobs.put(
                                `${context.run.id}/segment/v${context.stageVersion}/${index}/section-${section.index}.png`,
                                cropped.image,
                                "image/png"
                            );
                            if (stored.isOk()) {
                                cropRef = stored.value;
                            }
                        }
                    } catch (error) {
                        await context.log.error({
                            message: `Could not crop section ${section.index} of ${page.url}.`,
                            error
                        });
                    }
                }
                if (cropWarning) {
                    croppingWarnings++;
                }
                sections.push({
                    ...section,
                    cropRef,
                    ...(cropWarning ? { cropWarning } : {}),
                    // Only when the crop is not at true scale, rounded so float noise is not "scaled".
                    ...(cropRef && Math.abs(cropScale - 1) > 0.001
                        ? { cropScale: Math.round(cropScale * 10000) / 10000 }
                        : {})
                });
            }

            totalSections += sections.length;
            pages.push({
                url: page.url,
                title: page.title,
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

        const artifact: SegmentArtifact = { pages, maxSectionHeight };
        const key = context.artifactKey("sections");
        const written = await context.store.putJson(key, artifact);
        if (written.isFail()) {
            return Result.fail(written.error);
        }

        await context.log.info({
            message: `Segmented ${pages.length} page(s) into ${totalSections} section(s) at a ${maxSectionHeight}px container height${
                croppingWarnings > 0
                    ? `; ${croppingWarnings} section(s) have a missing or partial crop`
                    : ""
            }.`
        });
        return Result.ok({ artifacts: { sections: key }, counts: { sections: totalSections } });
    }
}

export const SegmentHandler = StageHandler.createImplementation({
    implementation: SegmentHandlerImpl,
    dependencies: [OverrideRepository]
});
