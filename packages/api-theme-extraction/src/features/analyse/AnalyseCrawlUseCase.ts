import { Output } from "ai";
import { createImplementation, Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { CreateThemeUseCase } from "@webiny/api-theme/features/CreateTheme/index.js";
import {
    ExtractionSettings,
    noopExtractionLog,
    ScreenshotStore,
    type IExtractionLog
} from "~/features/shared/abstractions.js";
import { ExtractionModelFailedError, type ExtractionError } from "~/features/shared/errors.js";
import { AnalyseCrawlUseCase as UseCaseAbstraction } from "./abstractions.js";
import { buildSystemPrompt, buildUserMessage } from "~/model/prompt.js";
import {
    isUsableAssignment,
    modelAssignmentSchema,
    validateAssignment,
    MIN_ACCEPTED_ASSIGNMENTS
} from "~/model/tokenAssignment.js";
import { createDefaultSettings } from "@webiny/theme-common";
import {
    applyAssignment,
    applyDerivedFonts,
    type ExtractionMetadata
} from "~/model/applyAssignment.js";
import { withTimeout } from "~/browser/withTimeout.js";

/**
 * Phase two: judgement — see the design brief, section 10.5.
 *
 * By the time this runs, everything decidable by counting has been decided. What is left is the part a
 * model is genuinely better at than an algorithm: telling a deliberate palette from an accidental one,
 * collapsing near-identical values into steps, and spotting that the colour used once on the primary
 * call to action matters more than the grey covering half the page.
 */

/**
 * Ceiling on the model call.
 *
 * Bounded like everything else, and sized so the whole extraction still fits one task invocation: the
 * crawl is capped at roughly five pages times the per-page ceiling, and this plus that leaves comfortable
 * headroom inside the fifteen-minute limit.
 */
export const MODEL_TIMEOUT_MS = 300_000;

const aiOutputSchema = Output.object({ schema: modelAssignmentSchema });

class AnalyseCrawlUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private ai: Ai.Interface,
        private settings: ExtractionSettings.Interface,
        private screenshots: ScreenshotStore.Interface,
        private createTheme: CreateThemeUseCase.Interface
    ) {}

    async execute(
        params: UseCaseAbstraction.Params
    ): Promise<Result<UseCaseAbstraction.Output, ExtractionError>> {
        const log = params.log ?? noopExtractionLog;

        const settings = await this.settings.getModel();
        if (settings.isFail()) {
            await log.error({ message: "No AI model is configured", error: settings.error });
            return Result.fail(settings.error);
        }

        const { model, connection } = settings.value;
        const { crawl, themeName } = params;

        const images = await this.loadScreenshots(crawl.screenshots, log);

        const startedAt = Date.now();
        await log.info({
            message: `Asking ${model} to build a theme`,
            data: {
                model,
                // Only a safe descriptor: an inline connection carries the API key, which must never
                // reach a log. A named connection is just an id; an inline one, only its provider.
                connection:
                    typeof connection === "string"
                        ? connection
                        : (connection?.sdkName ?? "(default)"),
                screenshotsSent: images.length,
                screenshotsUnavailable: crawl.screenshots.length - images.length,
                colorsOffered: crawl.payload.colors.length,
                darkMode: crawl.payload.darkMode
            }
        });

        const assignment = await this.ask({ model, connection, crawl, images });
        if (assignment.isFail()) {
            await log.error({
                message: "The AI model call failed",
                error: assignment.error,
                data: { model, durationMs: Date.now() - startedAt }
            });
            return Result.fail(assignment.error);
        }

        const validated = validateAssignment(assignment.value);

        // The model's own account of what it did, next to what we made of it. This pair is what makes a
        // disappointing theme diagnosable: whether the model misread the site, or we rejected what it
        // said.
        await log.info({
            message: `The model returned ${validated.accepted.length} usable value(s)`,
            data: {
                durationMs: Date.now() - startedAt,
                confidence: assignment.value.confidence,
                summary: assignment.value.summary,
                accepted: validated.accepted.length,
                rejected: validated.rejected.length,
                darkAccepted: validated.darkAccepted.length,
                darkRejected: validated.darkRejected.length,
                uncertain: assignment.value.uncertain,
                rejectedDetail: [...validated.rejected, ...validated.darkRejected].map(entry => ({
                    path: entry.path,
                    reason: entry.reason
                }))
            }
        });

        if (!isUsableAssignment(validated)) {
            // A theme that is almost entirely defaults looks like a result while being none, so this is
            // reported rather than saved. The specifics — what was accepted, rejected and why — are on
            // the task's log record; this message stays a plain summary for the person who started it.
            return Result.fail(
                new ExtractionModelFailedError(
                    `only ${validated.accepted.length} of the values the model returned could be ` +
                        `used, and at least ${MIN_ACCEPTED_ASSIGNMENTS} are needed for a meaningful theme`
                )
            );
        }

        const applied = applyAssignment(validated, crawl.roleSignals);

        const metadata: ExtractionMetadata = {
            source: "extraction",
            entryUrl: crawl.payload.source.entryUrl,
            sampledUrls: crawl.payload.source.sampledUrls,
            crawledOn: crawl.crawledOn,
            model,
            confidence: assignment.value.confidence,
            summary: assignment.value.summary,
            // The model's own uncertainties, plus any low-confidence per-role snaps the deterministic
            // pass flagged (a radius/border it inferred from very few elements, or fitted loosely).
            uncertain: [...assignment.value.uncertain, ...applied.uncertain],
            // Everything discarded is recorded on the theme. A generated theme that looks odd should be
            // explainable from what it stores, not from a log nobody kept.
            discarded: [
                ...validated.rejected.map(entry => ({ path: entry.path, reason: entry.reason })),
                ...validated.darkRejected.map(entry => ({
                    path: entry.path,
                    reason: entry.reason
                })),
                ...applied.failed
            ],
            appliedCount: applied.applied.length
        };

        // The site's fonts (when the model named real ones) become the theme's font set, so the roles
        // that reference them load and render the site's typography rather than the Webiny defaults.
        const themeSettings = applyDerivedFonts(createDefaultSettings(), applied.fonts);

        const created = await this.createTheme.execute({
            properties: {
                name: themeName,
                description: `Generated from ${crawl.payload.source.entryUrl}. ${assignment.value.summary}`
            },
            tokens: applied.document,
            settings: themeSettings,
            metadata: metadata as unknown as Record<string, unknown>
        });

        if (created.isFail()) {
            await log.error({ message: "The theme could not be saved", error: created.error });
            return Result.fail(
                new ExtractionModelFailedError(
                    `the theme could not be saved (${created.error.message})`
                )
            );
        }

        await log.info({
            message: `Created draft theme "${themeName}"`,
            data: {
                themeId: created.value.id,
                slotsApplied: applied.applied.length,
                slotsFailedToApply: applied.failed,
                // Listed so "why is this slot still the default?" is answerable from the log.
                appliedPaths: applied.applied
            }
        });

        return Result.ok({ themeId: created.value.id, metadata });
    }

    /**
     * Reads the screenshots back from storage.
     *
     * Best-effort per image: the inventory alone is enough to produce a theme, so a screenshot we
     * cannot read costs the model some context rather than costing the user their extraction.
     */
    private async loadScreenshots(
        stored: UseCaseAbstraction.Params["crawl"]["screenshots"],
        log: IExtractionLog
    ): Promise<Array<{ label: string; base64: string }>> {
        const images: Array<{ label: string; base64: string }> = [];

        for (const screenshot of stored) {
            const bytes = await this.screenshots.get(screenshot.key);
            if (bytes.isFail()) {
                // Most likely cause is the lifecycle rule having expired them, which is also why a
                // cached crawl is refused past `CRAWL_CACHE_MAX_AGE_DAYS`.
                await log.error({
                    message: `Could not read screenshot ${screenshot.key}; continuing without it`,
                    error: bytes.error
                });
                continue;
            }

            images.push({
                label: screenshot.label,
                base64: Buffer.from(bytes.value).toString("base64")
            });
        }

        return images;
    }

    private async ask({
        model,
        connection,
        crawl,
        images
    }: {
        model: string;
        connection?: ExtractionSettings.Model["connection"];
        crawl: UseCaseAbstraction.Params["crawl"];
        images: Array<{ label: string; base64: string }>;
    }) {
        const includeDarkGuidance =
            crawl.payload.darkMode.probed && crawl.payload.darkMode.hasDarkVariant;

        // Images are sent as base64, not as URLs. A URL would force the provider to fetch from our
        // bucket, which fails for a private bucket and leaks the deployment's domain either way.
        const content = [
            {
                type: "text" as const,
                text: buildUserMessage({ payload: crawl.payload, includeDarkGuidance })
            },
            ...images.flatMap(image => [
                { type: "text" as const, text: `Screenshot: ${image.label}` },
                { type: "file" as const, data: image.base64, mediaType: "image/png" }
            ])
        ];

        try {
            const result = await withTimeout("ask the AI model for a theme", MODEL_TIMEOUT_MS, () =>
                this.ai.generateText({
                    model,
                    connection,
                    output: aiOutputSchema,
                    system: buildSystemPrompt(),
                    messages: [{ role: "user", content }]
                })
            );

            return Result.ok(result.output);
        } catch (error) {
            return Result.fail(
                new ExtractionModelFailedError(
                    error instanceof Error ? error.message : String(error)
                )
            );
        }
    }
}

export const AnalyseCrawlUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: AnalyseCrawlUseCaseImpl,
    dependencies: [Ai, ExtractionSettings, ScreenshotStore, CreateThemeUseCase]
});
