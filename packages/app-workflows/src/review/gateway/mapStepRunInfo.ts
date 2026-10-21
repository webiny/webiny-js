import type { ReviewStepRunInfoDto } from "./dto.js";
import type { ReviewStepRunInfo } from "~/review/domain/types.js";
import { StepRunTaskStatus } from "~/review/domain/StepRunTaskStatus.js";

const toStatus = (value: string): StepRunTaskStatus => {
    if (value === StepRunTaskStatus.Pending) {
        return StepRunTaskStatus.Pending;
    }
    if (value === StepRunTaskStatus.Running) {
        return StepRunTaskStatus.Running;
    }
    if (value === StepRunTaskStatus.Done) {
        return StepRunTaskStatus.Done;
    }
    if (value === StepRunTaskStatus.Failed) {
        return StepRunTaskStatus.Failed;
    }
    if (value === StepRunTaskStatus.Aborted) {
        return StepRunTaskStatus.Aborted;
    }
    throw new Error(`Unknown step run status: ${value}.`);
};

/*
 * Maps a `WorkflowsStepRunInfo` (R257). The server maps its task statuses itself, so a status
 * outside the union means the two sides disagree: this throws instead of showing a wrong status.
 */
export const mapStepRunInfo = (dto: ReviewStepRunInfoDto): ReviewStepRunInfo => {
    return {
        taskId: dto.taskId,
        status: toStatus(dto.status),
        startedOn: dto.startedOn ?? null,
        finishedOn: dto.finishedOn ?? null,
        iterations: dto.iterations,
        outcome: dto.outcome ?? null,
        reason: dto.reason ?? null
    };
};
