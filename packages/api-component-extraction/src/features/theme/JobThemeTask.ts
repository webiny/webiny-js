import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { CrawlSiteUseCase } from "@webiny/api-theme-extraction/features/crawl/abstractions.js";
import { AnalyseCrawlUseCase } from "@webiny/api-theme-extraction/features/analyse/abstractions.js";
import { ExtractionLock } from "@webiny/api-theme-extraction/features/shared/abstractions.js";
import { PublishThemeUseCase } from "@webiny/api-theme/features/PublishTheme/index.js";
import { JOB_THEME_TASK_ID } from "~/constants.js";
import { JobRepository, RunRepository } from "~/domain/abstractions.js";
import { markStaleFrom, stageEntry } from "~/domain/ledger.js";
import type { Job, JobThemeExtraction } from "~/domain/types.js";
import { describeCrawlProgress } from "./themeStep.js";

/**
 * A job's own theme, extracted from its site, published and pinned (theme-in-pipeline-build-plan.md).
 *
 * Theme extraction's own crawl and analysis, unchanged, under its own one-per-tenant lock; then the
 * draft it saves is published, because the pipeline binds only against a published theme, and pinned
 * on the job. Every step is written to the job's `themeExtraction`, which the run view shows and the
 * stage gate quotes. Nothing retries silently: a failure is recorded with extraction's own reason.
 */
export interface JobThemeTaskInput {
    jobId: string;
    runId: string;
    /** Correlates the lock and extraction's screenshots. */
    extractionId: string;
    /** Re-extract a job that already has a theme: read the site again, re-pin, mark Cluster on stale. */
    retry?: boolean;
}

type RunParams = TaskHandler.RunParams<JobThemeTaskInput>;
type RunResult = Promise<TaskHandler.Result<JobThemeTaskInput>>;

/** How long a job waits between asks for the lock another extraction holds. */
const LOCK_WAIT_SECONDS = 20;

export class JobThemeTaskHandlerImpl implements TaskHandler.Interface<JobThemeTaskInput> {
    constructor(
        private jobs: JobRepository.Interface,
        private runs: RunRepository.Interface,
        private crawlSite: CrawlSiteUseCase.Interface,
        private analyseCrawl: AnalyseCrawlUseCase.Interface,
        private lock: ExtractionLock.Interface,
        private publishTheme: PublishThemeUseCase.Interface
    ) {}

    async run({ input, controller }: RunParams): RunResult {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }
        const log = controller.logger;
        const jobResult = await this.jobs.get(input.jobId);
        if (jobResult.isFail()) {
            return controller.response.error(jobResult.error.message);
        }
        const job = jobResult.value;
        const started = job.themeExtraction?.startedOn ?? new Date().toISOString();
        const write = (values: Partial<JobThemeExtraction>) =>
            this.jobs.update(job.id, {
                themeExtraction: {
                    status: "running",
                    step: "",
                    // Recorded by the resolver that triggered this task; kept as it is.
                    taskId: null,
                    runId: input.runId,
                    startedOn: started,
                    finishedOn: null,
                    themeEntryId: null,
                    themeVersion: null,
                    confidence: null,
                    uncertain: [],
                    pagesSampled: 0,
                    slotsApplied: 0,
                    error: null,
                    ...job.themeExtraction,
                    ...values
                }
            });

        // One extraction at a time per tenant: a second job waits for the lock and says so.
        const acquired = await this.lock.acquire(input.extractionId);
        if (acquired.isFail()) {
            await write({
                status: "failed",
                step: "failed",
                error: acquired.error.message,
                finishedOn: new Date().toISOString()
            });
            return controller.response.error(acquired.error.message);
        }
        if (!acquired.value) {
            await write({
                status: "waiting",
                step: "waiting for another theme extraction to finish"
            });
            return controller.response.continue(input, { seconds: LOCK_WAIT_SECONDS });
        }

        try {
            await write({ status: "running", step: "starting", error: null, finishedOn: null });
            const crawl = await this.crawlSite.execute({
                extractionId: input.extractionId,
                entryUrl: job.siteUrl,
                // A retry reads the site again; a first extraction has no cache to reuse anyway.
                force: input.retry === true,
                log,
                onProgress: async progress => {
                    await write({ step: describeCrawlProgress(progress) });
                }
            });
            if (crawl.isFail()) {
                return this.fail(job, input, write, crawl.error.message, controller);
            }

            await write({ step: "analysing the crawled pages" });
            const analysed = await this.analyseCrawl.execute({
                crawl: crawl.value,
                themeName: `${job.name} (extracted)`,
                log
            });
            if (analysed.isFail()) {
                return this.fail(job, input, write, analysed.error.message, controller);
            }

            // The pipeline binds only against a published theme, so the draft is published as it is.
            await write({ step: "publishing the theme" });
            const published = await this.publishTheme.execute({
                id: analysed.value.themeId,
                comment: `Extracted from ${job.siteUrl} for the component extraction job "${job.name}".`
            });
            if (published.isFail()) {
                return this.fail(job, input, write, published.error.message, controller);
            }
            const theme = published.value.theme;
            const metadata = analysed.value.metadata;

            const pinned = await this.jobs.update(job.id, {
                themeEntryId: theme.entryId,
                themeVersion: theme.version
            });
            if (pinned.isFail()) {
                return this.fail(job, input, write, pinned.error.message, controller);
            }
            await write({
                status: "done",
                step: "done",
                finishedOn: new Date().toISOString(),
                themeEntryId: theme.entryId,
                themeVersion: theme.version,
                confidence: metadata.confidence ?? null,
                uncertain: (metadata.uncertain ?? []).map(entry => ({
                    ...(entry.path ? { path: entry.path } : {}),
                    reason: entry.reason
                })),
                pagesSampled: crawl.value.payload.source.sampledUrls.length,
                slotsApplied: metadata.appliedCount ?? 0,
                error: null
            });

            // A re-extraction replaces what Cluster onward was built on.
            if (input.retry && job.themeEntryId) {
                await this.markThemeReadersStale(input.runId);
            }
            await log.info({
                message: `Theme for "${job.name}" extracted, published and pinned: ${theme.entryId} v${theme.version}.`
            });
            return controller.response.done(`Theme pinned: ${theme.entryId} v${theme.version}.`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return this.fail(job, input, write, message, controller);
        } finally {
            await this.lock.release(input.extractionId);
        }
    }

    private async fail(
        job: Job,
        input: JobThemeTaskInput,
        write: (values: Partial<JobThemeExtraction>) => Promise<unknown>,
        message: string,
        controller: RunParams["controller"]
    ): RunResult {
        await write({
            status: "failed",
            step: "failed",
            error: message,
            finishedOn: new Date().toISOString()
        });
        await controller.logger.error({
            message: `Theme extraction for "${job.name}" failed: ${message}`
        });
        return controller.response.error(message);
    }

    private async markThemeReadersStale(runId: string): Promise<void> {
        const run = await this.runs.get(runId);
        if (run.isFail()) {
            return;
        }
        if (!stageEntry(run.value.stages, "cluster")) {
            return;
        }
        await this.runs.update(runId, { stages: markStaleFrom(run.value.stages, "cluster") });
    }
}

const JobThemeTaskHandler = TaskHandler.createImplementation({
    implementation: JobThemeTaskHandlerImpl,
    dependencies: [
        JobRepository,
        RunRepository,
        CrawlSiteUseCase,
        AnalyseCrawlUseCase,
        ExtractionLock,
        PublishThemeUseCase
    ]
});

class JobThemeTaskImpl implements TaskDefinition.Interface<JobThemeTaskInput> {
    readonly id = JOB_THEME_TASK_ID;
    readonly title = "Component extraction — job theme";
    readonly description = "Extracts, publishes and pins a job's theme from its site.";
    // Waiting for the lock continues the task; 60 waits of 20 seconds is twenty minutes.
    readonly maxIterations = 60;
    readonly isPrivate = false;
    readonly databaseLogs = true;

    readonly handler = JobThemeTaskHandler;
}

export const JobThemeTask = TaskDefinition.createImplementation({
    implementation: JobThemeTaskImpl,
    dependencies: []
});
