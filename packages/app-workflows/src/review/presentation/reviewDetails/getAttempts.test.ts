import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getAttempts } from "./getAttempts.js";
import { StepState } from "~/review/domain/StepState.js";
import type { ReviewStep } from "~/review/domain/types.js";
import type { ReviewStepRun } from "~/review/domain/types.js";
import { at } from "~/review/testing/at.js";
import { createActor } from "~/review/testing/createActor.js";
import { createFailedAutomationStep } from "~/review/testing/createAutomatedStep.js";
import { createRunningAiStep } from "~/review/testing/createAutomatedStep.js";
import { createStep } from "~/review/testing/createStep.js";

const run = (overrides: Partial<ReviewStepRun> = {}): ReviewStepRun => {
    return {
        taskId: "task-1",
        startedOn: at(9, 0),
        finishedOn: at(9, 5),
        outcome: "failed",
        reason: "Webhook returned 503",
        ...overrides
    };
};

// The AI step "AI tone check", failed 10:00-10:05 with its task and reason.
const aiStep = (overrides: Partial<ReviewStep> = {}): ReviewStep => {
    return createRunningAiStep({
        state: StepState.Failed,
        startedOn: at(10, 0),
        finishedOn: at(10, 5),
        comment: "Provider unavailable: request timed out after 60 s",
        taskId: "task-2",
        ...overrides
    });
};

describe("getAttempts (R261)", () => {
    it("lists the runs oldest first and then the current attempt as the last row", () => {
        const step = aiStep({ runs: [run()] });

        expect(getAttempts(step, false)).toEqual([
            {
                number: 1,
                numberText: "#1",
                span: "09:00–09:05",
                outcome: "Failed",
                outcomeTone: "failed",
                reason: "Webhook returned 503",
                taskId: "task-1",
                showTaskLink: false
            },
            {
                number: 2,
                numberText: "#2",
                span: "10:00–10:05",
                outcome: "Failed",
                outcomeTone: "failed",
                reason: "Provider unavailable: request timed out after 60 s",
                taskId: "task-2",
                showTaskLink: false
            }
        ]);
    });

    it("numbers several runs in the order received", () => {
        const step = aiStep({
            runs: [
                run({ taskId: "task-a", startedOn: at(8, 0), finishedOn: at(8, 1) }),
                run({ taskId: "task-b", startedOn: at(9, 0), finishedOn: at(9, 1) })
            ]
        });

        const attempts = getAttempts(step, false);

        expect(attempts.map(attempt => attempt.number)).toEqual([1, 2, 3]);
        expect(attempts.map(attempt => attempt.taskId)).toEqual(["task-a", "task-b", "task-2"]);
    });

    it("shows the task link only to an operator and only for a row with a task id", () => {
        const step = aiStep({
            runs: [run({ taskId: null }), run({ taskId: "task-1" })]
        });

        expect(getAttempts(step, true).map(attempt => attempt.showTaskLink)).toEqual([
            false,
            true,
            true
        ]);
        expect(getAttempts(step, false).map(attempt => attempt.showTaskLink)).toEqual([
            false,
            false,
            false
        ]);
    });

    it("reads a running current attempt as 'since {start}' and 'Running'", () => {
        const step = aiStep({
            state: StepState.InReview,
            startedOn: at(14, 20),
            finishedOn: null,
            comment: null
        });

        expect(getAttempts(step, false)).toEqual([
            {
                number: 1,
                numberText: "#1",
                span: "since 14:20",
                outcome: "Running",
                outcomeTone: "running",
                reason: null,
                taskId: "task-2",
                showTaskLink: false
            }
        ]);
    });

    it("ignores a stale end time while the step is running", () => {
        const step = aiStep({
            state: StepState.InReview,
            startedOn: at(14, 20),
            finishedOn: at(14, 25)
        });

        expect(getAttempts(step, false)[0]).toMatchObject({
            span: "since 14:20",
            outcome: "Running",
            outcomeTone: "running"
        });
    });

    it("reads an approved or rejected current attempt with its outcome and no reason", () => {
        const approved = aiStep({ state: StepState.Approved, comment: "Looks fine." });
        const rejected = aiStep({ state: StepState.Rejected, comment: "Too casual." });

        expect(getAttempts(approved, false)[0]).toMatchObject({
            span: "10:00–10:05",
            outcome: "Approved",
            outcomeTone: "approved",
            reason: null
        });
        expect(getAttempts(rejected, false)[0]).toMatchObject({
            span: "10:00–10:05",
            outcome: "Rejected",
            outcomeTone: "rejected",
            reason: null
        });
    });

    it("works for an automation step", () => {
        const step = createFailedAutomationStep({
            startedOn: at(11, 0),
            finishedOn: at(11, 2)
        });

        expect(getAttempts(step, false)[0]).toMatchObject({
            numberText: "#1",
            span: "11:00–11:02",
            outcome: "Failed",
            reason: "Webhook returned 503 Service Unavailable"
        });
    });

    it("has no current row for a step that has not started or is awaiting or pending", () => {
        const notStarted = aiStep({
            state: StepState.Awaiting,
            owner: null,
            startedOn: null,
            finishedOn: null,
            comment: null,
            runs: [run()]
        });
        const pending = aiStep({ state: StepState.Pending, owner: null, runs: [run()] });

        expect(getAttempts(notStarted, false)).toHaveLength(1);
        expect(getAttempts(pending, false)).toHaveLength(1);
    });

    it("lists nothing for a step a person reviews", () => {
        const person = createStep({
            type: "review",
            state: StepState.Approved,
            owner: createActor({ id: "user-2", displayName: "Luka Perić" }),
            startedOn: at(10, 0),
            finishedOn: at(10, 5),
            runs: [run()]
        });

        expect(getAttempts(person, true)).toEqual([]);
    });

    it("reads a run without an end time as running and a run without an outcome as 'Running'", () => {
        const step = aiStep({
            state: StepState.Awaiting,
            owner: null,
            startedOn: null,
            runs: [run({ finishedOn: null, outcome: null, reason: null })]
        });

        expect(getAttempts(step, false)[0]).toMatchObject({
            span: "since 09:00",
            outcome: "Running",
            outcomeTone: "running"
        });
    });

    it("shows an outcome it does not know as received", () => {
        const step = aiStep({
            state: StepState.Awaiting,
            owner: null,
            startedOn: null,
            runs: [run({ outcome: "timedOut", reason: null })]
        });

        expect(getAttempts(step, false)[0]).toMatchObject({
            span: "09:00–09:05",
            outcome: "timedOut",
            outcomeTone: "failed"
        });
    });

    it("trims the reason and leaves a blank reason out", () => {
        const step = aiStep({
            runs: [run({ reason: "  Webhook returned 503  " }), run({ reason: "   " })],
            comment: null
        });

        const reasons = getAttempts(step, false).map(attempt => attempt.reason);

        expect(reasons).toEqual(["Webhook returned 503", null, null]);
    });

    it("leaves out the time span of an unparsable start", () => {
        const step = aiStep({
            state: StepState.Awaiting,
            owner: null,
            startedOn: null,
            runs: [run({ startedOn: "not a date" })]
        });

        expect(getAttempts(step, false)[0]).toMatchObject({
            numberText: "#1",
            span: "",
            outcome: "Failed",
            reason: "Webhook returned 503"
        });
    });
});
