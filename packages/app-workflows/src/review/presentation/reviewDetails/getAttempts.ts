import type { ReviewStep } from "~/review/domain/types.js";
import { StepState } from "~/review/domain/StepState.js";
import { formatTimeOfDay } from "../time/formatTimeOfDay.js";
import type { ReviewAttemptVm } from "./abstractions.js";

interface AttemptRow {
    number: number;
    startedOn: string;
    finishedOn: string | null;
    // The outcome of the attempt, `null` while it is running.
    outcome: string | null;
    reason: string | null;
    taskId: string | null;
    canViewStepRun: boolean;
}

// Only AI and automation steps have attempts (D82); a people step has one decision, not runs.
const AUTOMATED_STEP_TYPES: string[] = ["ai", "automation"];

const formatClock = (iso: string): string => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return "";
    }
    return formatTimeOfDay(date);
};

// "10:00–10:05", or "since 10:00" while the attempt has no end (R261).
const getSpan = (startedOn: string, finishedOn: string | null): string => {
    const started = formatClock(startedOn);
    if (started === "") {
        return "";
    }
    if (finishedOn !== null) {
        const finished = formatClock(finishedOn);
        if (finished !== "") {
            return `${started}–${finished}`;
        }
    }
    return `since ${started}`;
};

const getOutcomeLabel = (outcome: string | null): string => {
    switch (outcome) {
        case null:
            return "Running";
        case "approved":
            return "Approved";
        case "rejected":
            return "Rejected";
        case "failed":
            return "Failed";
        default:
            return outcome;
    }
};

const toAttempt = (row: AttemptRow): ReviewAttemptVm => {
    const span = getSpan(row.startedOn, row.finishedOn);
    const parts = [`#${row.number}`, span, getOutcomeLabel(row.outcome)];
    if (row.reason !== null && row.reason.trim() !== "") {
        parts.push(row.reason.trim());
    }
    const text = parts.filter(part => part !== "").join(" ");

    return {
        number: row.number,
        text,
        taskId: row.taskId,
        showTaskLink: row.canViewStepRun && row.taskId !== null
    };
};

const getCurrentOutcome = (step: ReviewStep): string | null => {
    switch (step.state) {
        case StepState.Approved:
            return "approved";
        case StepState.Rejected:
            return "rejected";
        case StepState.Failed:
            return "failed";
        default:
            return null;
    }
};

/*
 * The attempts of an AI or automation step, oldest first (R261): every `runs[]` record, then the
 * current attempt as the last row when the step has started and is running or has an outcome.
 * `canViewStepRun` is the operator rule (R258): the task link shows only with it and only for a
 * row with a task id. A people step lists nothing. Pure.
 */
export const getAttempts = (step: ReviewStep, canViewStepRun: boolean): ReviewAttemptVm[] => {
    if (!AUTOMATED_STEP_TYPES.includes(step.type)) {
        return [];
    }

    const attempts = step.runs.map((run, index) => {
        return toAttempt({
            number: index + 1,
            startedOn: run.startedOn,
            finishedOn: run.finishedOn,
            outcome: run.outcome,
            reason: run.reason,
            taskId: run.taskId,
            canViewStepRun
        });
    });

    const running = step.state === StepState.InReview;
    const hasOutcome = getCurrentOutcome(step) !== null;
    if (step.startedOn === null || (!running && !hasOutcome)) {
        return attempts;
    }

    let finishedOn: string | null = null;
    if (!running) {
        finishedOn = step.finishedOn;
    }
    let reason: string | null = null;
    if (step.state === StepState.Failed) {
        reason = step.comment;
    }
    const current = toAttempt({
        number: step.runs.length + 1,
        startedOn: step.startedOn,
        finishedOn,
        outcome: getCurrentOutcome(step),
        reason,
        taskId: step.taskId,
        canViewStepRun
    });
    attempts.push(current);
    return attempts;
};
