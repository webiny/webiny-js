import {
    TaskDefinition,
    type IResponseError
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-websockets/features/SendToIdentity/abstractions.js";
import { CrawlSiteUseCase } from "~/features/crawl/abstractions.js";
import { AnalyseCrawlUseCase } from "~/features/analyse/abstractions.js";
import { ExtractionLock } from "~/features/shared/abstractions.js";
import { ExtractionInProgressError } from "~/features/shared/errors.js";
import {
    describeStep,
    EXTRACTION_DONE_ACTION,
    EXTRACTION_FAILED_ACTION,
    EXTRACTION_PROGRESS_ACTION,
    progressPercent,
    type ExtractionStep
} from "~/features/progress/ExtractionProgress.js";

/**
 * Generating a theme from a website, end to end — see the design brief, section 10.
 *
 * This is one task rather than a parent spawning crawl and analyse children, which is a change from the
 * shape originally sketched. The reason is that every step is already individually bounded — five pages
 * at a 60-second per-page ceiling, plus a five-minute ceiling on the model call — so the worst case fits
 * inside a single fifteen-minute invocation with room to spare. A parent polling child tasks would have
 * added dozens of invocations of state-machine code to buy budget headroom we already have, and the
 * retry benefit it was meant to provide comes from the crawl cache instead: a retry after a failed model
 * call skips the crawl entirely without re-reading anyone's site.
 *
 * The two phases remain separate use cases, so the separation of concerns and their testability survive
 * the merge.
 */

export const THEME_EXTRACTION_TASK_ID = "themeExtraction";

export interface IThemeExtractionTaskInput {
    /** Correlates progress messages, the lock and the screenshot prefix. */
    extractionId: string;
    entryUrl: string;
    themeName: string;
    crawlLimit?: number;
    /** Skip the crawl cache and read the site again. */
    force?: boolean;
}

/**
 * The index signature mirrors what the task framework's `IGenericOutput` permits, rather than being a
 * looser `unknown` — otherwise this type cannot be used as the output parameter when reading the task
 * back, which is exactly what the status query does.
 */
export interface IThemeExtractionTaskOutput {
    themeId?: string;
    entryUrl?: string;
    sampledUrls?: string[];
    error?: IResponseError;
    [key: string]: string | string[] | IResponseError | undefined;
}

const hostOf = (url: string): string => {
    try {
        return new URL(url).host;
    } catch {
        return url;
    }
};

class ThemeExtractionTaskImpl implements TaskDefinition.Interface<
    IThemeExtractionTaskInput,
    IThemeExtractionTaskOutput
> {
    id = THEME_EXTRACTION_TASK_ID;
    title = "Theme — generate from a website";
    description = "Reads a website and generates a draft theme from its design.";
    // One pass does everything; see the header note on why this needs no continuation protocol.
    maxIterations = 1;
    isPrivate = false;
    databaseLogs = true;

    constructor(
        private crawlSite: CrawlSiteUseCase.Interface,
        private analyseCrawl: AnalyseCrawlUseCase.Interface,
        private lock: ExtractionLock.Interface,
        private identityContext: IdentityContext.Interface,
        private sendToIdentity: WebsocketsSendToIdentityUseCase.Interface
    ) {}

    async run({
        input,
        controller
    }: TaskDefinition.RunParams<IThemeExtractionTaskInput, IThemeExtractionTaskOutput>): Promise<
        TaskDefinition.Result<IThemeExtractionTaskInput, IThemeExtractionTaskOutput>
    > {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const { extractionId, entryUrl, themeName } = input;
        const host = hostOf(entryUrl);
        const startedAt = Date.now();

        // `controller.logger` is handed straight to the use cases — its shape is what `IExtractionLog`
        // was modelled on. Every entry is persisted to this task's log record immediately, so the trail
        // survives a crash and shows up in the Admin task viewer next to the run that produced it.
        const log = controller.logger;

        await log.info({
            message: `Generating a theme from ${entryUrl}`,
            data: {
                extractionId,
                entryUrl,
                themeName,
                crawlLimit: input.crawlLimit,
                force: input.force === true,
                remainingSeconds: controller.runtime.getRemainingSeconds()
            }
        });

        const acquired = await this.lock.acquire(extractionId);
        if (acquired.isFail()) {
            await log.error({
                message: "Could not reserve the extraction slot",
                error: acquired.error
            });
            return controller.response.error(acquired.error.message);
        }

        if (!acquired.value) {
            const current = await this.lock.current();
            const message = new ExtractionInProgressError(
                current.isOk() && current.value ? current.value : "unknown"
            ).message;

            await log.error({ message });
            await this.fail(extractionId, message);
            return controller.response.error(message);
        }

        try {
            await this.report(extractionId, { step: "checking-rules" }, host);

            const crawl = await this.crawlSite.execute({
                extractionId,
                entryUrl,
                crawlLimit: input.crawlLimit,
                force: input.force,
                log,
                onProgress: async progress => {
                    await this.report(
                        extractionId,
                        {
                            step: "crawling",
                            pagesDone: progress.pagesDone,
                            pagesTotal: progress.pagesTotal
                        },
                        host,
                        progress.currentUrl
                    );
                }
            });

            if (crawl.isFail()) {
                // The use cases already logged the specifics; this records the outcome and stops.
                await log.error({
                    message: "Extraction stopped during the crawl",
                    error: crawl.error
                });
                await this.fail(extractionId, crawl.error.message);
                return controller.response.error(crawl.error.message);
            }

            await this.report(extractionId, { step: "analysing" }, host);

            const analysed = await this.analyseCrawl.execute({
                crawl: crawl.value,
                themeName,
                log
            });

            if (analysed.isFail()) {
                await log.error({
                    message: "Extraction stopped during analysis",
                    error: analysed.error,
                    // Stated explicitly, because it changes what the user should do next.
                    data: { crawlWasCachedForRetry: true }
                });
                await this.fail(extractionId, analysed.error.message);
                return controller.response.error(analysed.error.message);
            }

            await this.report(extractionId, { step: "creating-theme" }, host);

            await this.send(EXTRACTION_DONE_ACTION, {
                extractionId,
                themeId: analysed.value.themeId,
                entryUrl,
                summary: analysed.value.metadata.summary,
                confidence: analysed.value.metadata.confidence,
                uncertain: analysed.value.metadata.uncertain
            });

            await log.info({
                message: `Finished in ${Math.round((Date.now() - startedAt) / 1000)}s`,
                data: {
                    themeId: analysed.value.themeId,
                    durationMs: Date.now() - startedAt,
                    remainingSeconds: controller.runtime.getRemainingSeconds(),
                    confidence: analysed.value.metadata.confidence,
                    uncertainCount: analysed.value.metadata.uncertain.length,
                    discardedCount: analysed.value.metadata.discarded.length
                }
            });

            return controller.response.done(`Generated a theme from ${host}.`, {
                themeId: analysed.value.themeId,
                entryUrl,
                sampledUrls: crawl.value.payload.source.sampledUrls
            });
        } catch (error) {
            // Anything unanticipated still has to release the lock and tell the user, or the next
            // extraction is refused by a slot nobody holds. Logged with the error object so the
            // framework records the stack.
            const message = error instanceof Error ? error.message : String(error);
            await log.error({
                message: "Extraction failed unexpectedly",
                error,
                data: { extractionId, entryUrl, durationMs: Date.now() - startedAt }
            });
            await this.fail(extractionId, message);
            return controller.response.error(message);
        } finally {
            // Screenshots are deliberately NOT deleted here: the crawl cache references their keys, and
            // removing them would leave a cache entry pointing at objects that no longer exist. They are
            // owned by the cache entry and cleaned up when it is replaced — see `CrawlSiteUseCase`.
            await this.lock.release(extractionId);
        }
    }

    private async report(
        extractionId: string,
        state: { step: ExtractionStep; pagesDone?: number; pagesTotal?: number },
        host: string,
        currentUrl?: string
    ): Promise<void> {
        await this.send(EXTRACTION_PROGRESS_ACTION, {
            extractionId,
            step: state.step,
            percent: progressPercent(state),
            message: describeStep({ ...state, host, currentUrl }),
            pagesDone: state.pagesDone,
            pagesTotal: state.pagesTotal
        });
    }

    private async fail(extractionId: string, message: string): Promise<void> {
        await this.send(EXTRACTION_FAILED_ACTION, { extractionId, message });
    }

    /**
     * Progress is a courtesy, not part of the work.
     *
     * A websocket send that fails must never take down an extraction that is otherwise succeeding — the
     * user would lose a working result to a dropped connection.
     *
     * This is the one place that logs to the console rather than to the task log, deliberately. It runs
     * inside the failure path (`fail()` is called from the catch block), and `addErrorLog` writes to the
     * database and throws if that write fails — so logging here could throw and mask the real error we
     * were in the middle of reporting. A dropped progress message is not worth that risk, and CloudWatch
     * is the right place for it.
     */
    private async send(action: string, data: Record<string, unknown>): Promise<void> {
        try {
            const identity = this.identityContext.getIdentity();
            await this.sendToIdentity.execute({ id: identity.id }, { action, data });
        } catch (error) {
            console.log(
                `[theme-extraction] Could not report progress: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }
    }
}

export const ThemeExtractionTask = TaskDefinition.createImplementation({
    implementation: ThemeExtractionTaskImpl,
    dependencies: [
        CrawlSiteUseCase,
        AnalyseCrawlUseCase,
        ExtractionLock,
        IdentityContext,
        WebsocketsSendToIdentityUseCase
    ]
});
