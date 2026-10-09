import { randomUUID } from "node:crypto";
import type { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { JOB_THEME_TASK_ID } from "~/constants.js";
import type { JobRepository } from "~/domain/abstractions.js";
import type { Job } from "~/domain/types.js";
import type { JobThemeTaskInput } from "./JobThemeTask.js";

/**
 * Starts a job's theme extraction and records it on the job at once, so the run view shows it
 * queued before the task has taken over.
 */
export const startJobTheme = async (
    deps: { jobs: JobRepository.Interface; taskService: TaskService.Interface },
    job: Job,
    runId: string,
    retry = false
): Promise<void> => {
    const extractionId = `job-theme-${randomUUID()}`;
    const triggered = await deps.taskService.trigger<JobThemeTaskInput>({
        definition: JOB_THEME_TASK_ID,
        name: `Component extraction — theme for "${job.name}"`,
        input: { jobId: job.id, runId, extractionId, ...(retry ? { retry: true } : {}) }
    });
    if (triggered.isFail()) {
        throw triggered.error;
    }
    const updated = await deps.jobs.update(job.id, {
        themeExtraction: {
            status: "running",
            step: "queued",
            taskId: triggered.value.id,
            runId,
            startedOn: new Date().toISOString(),
            finishedOn: null,
            themeEntryId: null,
            themeVersion: null,
            confidence: null,
            uncertain: [],
            pagesSampled: 0,
            slotsApplied: 0,
            error: null
        }
    });
    if (updated.isFail()) {
        throw updated.error;
    }
};
