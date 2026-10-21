import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getStepRunPanel } from "./getStepRunPanel.js";
import { STEP_RUN_GONE_TEXT } from "./getStepRunPanel.js";
import { STEP_RUN_PANEL_TITLE } from "./getStepRunPanel.js";
import { formatReviewTimeFull } from "./formatReviewTimeFull.js";
import type { ReviewStepRunInfo } from "~/review/domain/types.js";
import { at } from "~/review/testing/at.js";
import { createStepRunInfo } from "~/review/testing/reviewFixtures.js";

// A failed run on top of Task 8's builder defaults (done, approved, one iteration).
const FAILED_RUN: Partial<ReviewStepRunInfo> = {
    status: "failed",
    startedOn: at(9, 0),
    finishedOn: at(9, 5),
    iterations: 3,
    outcome: "failed",
    reason: "Provider unavailable: request timed out after 60 s"
};

const open = (info: ReviewStepRunInfo | null, overrides = {}) => {
    return getStepRunPanel({ open: true, loading: false, error: null, info, ...overrides });
};

describe("getStepRunPanel (R264)", () => {
    it("names the heading", () => {
        expect(STEP_RUN_PANEL_TITLE).toBe("Background task");
        expect(STEP_RUN_GONE_TEXT).toBe("This task is no longer available.");
    });

    it("is closed and empty while closed", () => {
        expect(getStepRunPanel({ open: false, loading: false, error: null, info: null })).toEqual({
            open: false,
            loading: false,
            error: null,
            gone: false,
            rows: []
        });
    });

    it("is loading and has no rows while loading, even if an old result is still there", () => {
        expect(open(createStepRunInfo(FAILED_RUN), { loading: true })).toEqual({
            open: true,
            loading: true,
            error: null,
            gone: false,
            rows: []
        });
    });

    it("shows the error and nothing else when the load failed", () => {
        expect(open(null, { error: "The server did not respond. Try again in a moment." })).toEqual(
            {
                open: true,
                loading: false,
                error: "The server did not respond. Try again in a moment.",
                gone: false,
                rows: []
            }
        );
    });

    it("is gone when the load returned no task", () => {
        expect(open(null)).toEqual({
            open: true,
            loading: false,
            error: null,
            gone: true,
            rows: []
        });
    });

    it("shows status, times, iterations and reason in that order", () => {
        const panel = open(createStepRunInfo(FAILED_RUN));

        expect(panel.gone).toBe(false);
        expect(panel.rows).toEqual([
            { label: "Status", value: "Failed" },
            { label: "Started", value: formatReviewTimeFull(at(9, 0)) },
            { label: "Finished", value: formatReviewTimeFull(at(9, 5)) },
            { label: "Iterations", value: "3" },
            { label: "Reason", value: "Provider unavailable: request timed out after 60 s" }
        ]);
        expect(panel.rows[1].value).toContain("2026");
    });

    it("labels every status", () => {
        const labels = (["pending", "running", "done", "failed", "aborted"] as const).map(
            status => {
                return open(createStepRunInfo({ ...FAILED_RUN, status })).rows[0].value;
            }
        );

        expect(labels).toEqual(["Pending", "Running", "Done", "Failed", "Aborted"]);
    });

    it("leaves out the rows that have no value", () => {
        const panel = open(
            createStepRunInfo({
                ...FAILED_RUN,
                status: "pending",
                startedOn: null,
                finishedOn: null,
                iterations: 0,
                reason: null
            })
        );

        expect(panel.rows).toEqual([
            { label: "Status", value: "Pending" },
            { label: "Iterations", value: "0" }
        ]);
    });

    it("leaves out a blank reason and an unparsable time", () => {
        const panel = open(
            createStepRunInfo({ ...FAILED_RUN, reason: "   ", startedOn: "not a date" })
        );

        expect(panel.rows.map(row => row.label)).toEqual(["Status", "Finished", "Iterations"]);
    });

    it("never shows the task id or the outcome", () => {
        const text = JSON.stringify(
            open(createStepRunInfo({ ...FAILED_RUN, taskId: "task-secret-1" }))
        );

        expect(text).not.toContain("task-secret-1");
    });
});
