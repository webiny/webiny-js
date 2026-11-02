import type { ReviewStepRunInfo } from "~/review/domain/types.js";
import type { ReviewStepRunPanelRowVm } from "./abstractions.js";
import type { ReviewStepRunPanelVm } from "./abstractions.js";
import { formatReviewTimeFull } from "./formatReviewTimeFull.js";

export const STEP_RUN_PANEL_TITLE = "Background task";
export const STEP_RUN_GONE_TEXT = "This task is no longer available.";

export interface StepRunPanelInput {
    open: boolean;
    loading: boolean;
    error: string | null;
    info: ReviewStepRunInfo | null;
}

const getStatusLabel = (status: string): string => {
    switch (status) {
        case "pending":
            return "Pending";
        case "running":
            return "Running";
        case "done":
            return "Done";
        case "failed":
            return "Failed";
        case "aborted":
            return "Aborted";
        default:
            return status;
    }
};

// A row without a value is left out: there is no copy for an empty value (R264).
const getRows = (info: ReviewStepRunInfo): ReviewStepRunPanelRowVm[] => {
    const rows: ReviewStepRunPanelRowVm[] = [
        { label: "Status", value: getStatusLabel(info.status) }
    ];

    if (info.startedOn !== null) {
        const started = formatReviewTimeFull(info.startedOn);
        if (started !== "") {
            rows.push({ label: "Started", value: started });
        }
    }
    if (info.finishedOn !== null) {
        const finished = formatReviewTimeFull(info.finishedOn);
        if (finished !== "") {
            rows.push({ label: "Finished", value: finished });
        }
    }
    rows.push({ label: "Iterations", value: String(info.iterations) });
    if (info.reason !== null && info.reason.trim() !== "") {
        rows.push({ label: "Reason", value: info.reason.trim() });
    }
    return rows;
};

/*
 * The render-ready task panel (R264): closed, loading, an error, "gone" (the task record no longer
 * exists, the use case returned `null`) or the rows of the task. The task id, the outcome, the
 * input, output and logs are never part of it (R146). Pure.
 */
export const getStepRunPanel = (input: StepRunPanelInput): ReviewStepRunPanelVm => {
    if (!input.open) {
        return { open: false, loading: false, error: null, gone: false, rows: [] };
    }
    if (input.loading) {
        return { open: true, loading: true, error: null, gone: false, rows: [] };
    }
    if (input.error !== null) {
        return { open: true, loading: false, error: input.error, gone: false, rows: [] };
    }
    if (input.info === null) {
        return { open: true, loading: false, error: null, gone: true, rows: [] };
    }
    return { open: true, loading: false, error: null, gone: false, rows: getRows(input.info) };
};
