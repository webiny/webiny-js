import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getStepStartedAt } from "./getStepStartedAt.js";
import { getStepRunMessage } from "./getStepRunMessage.js";
import { getStepTagTooltip } from "./getStepTagTooltip.js";
import { getStepStateTag } from "./getStepStateTag.js";
import { StepState } from "~/review/domain/StepState.js";
import { createActor } from "~/review/testing/createActor.js";
import { createStep } from "~/review/testing/createStep.js";
import { at } from "~/review/testing/at.js";
import { createFailedAutomationStep } from "~/review/testing/createAutomatedStep.js";
import { createRunningAiStep } from "~/review/testing/createAutomatedStep.js";
import { createRunningAutomationStep } from "~/review/testing/createAutomatedStep.js";

const LUKA = createActor({ id: "user-2", displayName: "Luka Perić" });

describe("getStepStartedAt", () => {
    it("formats the start of the attempt as hh:mm", () => {
        expect(getStepStartedAt(createRunningAiStep())).toBe("14:20");
    });

    it("is null without a start time", () => {
        expect(getStepStartedAt(createRunningAiStep({ startedOn: null }))).toBeNull();
    });

    it("is null for an unparsable start time", () => {
        expect(getStepStartedAt(createRunningAiStep({ startedOn: "not a date" }))).toBeNull();
    });
});

describe("getStepRunMessage (R263)", () => {
    it("reads '{Step} is running.' for a running AI step", () => {
        expect(getStepRunMessage(createRunningAiStep())).toBe("AI tone check is running.");
    });

    it("reads the same for a running automation step", () => {
        const step = createRunningAutomationStep();
        expect(getStepRunMessage(step)).toBe("Notify web team is running.");
    });

    it("is null for a running step without a usable start time", () => {
        expect(getStepRunMessage(createRunningAiStep({ startedOn: null }))).toBeNull();
        expect(getStepRunMessage(createRunningAiStep({ startedOn: "not a date" }))).toBeNull();
    });

    it("reads '{Step} failed: {reason}' for a failed step", () => {
        expect(getStepRunMessage(createFailedAutomationStep())).toBe(
            "Notify web team failed: Webhook returned 503 Service Unavailable"
        );
    });

    it("trims the reason", () => {
        expect(
            getStepRunMessage(createFailedAutomationStep({ comment: "  Provider unavailable.  " }))
        ).toBe("Notify web team failed: Provider unavailable.");
    });

    it("reads '{Step} failed.' for a failed step without a reason (R264)", () => {
        expect(getStepRunMessage(createFailedAutomationStep({ comment: null }))).toBe(
            "Notify web team failed."
        );
        expect(getStepRunMessage(createFailedAutomationStep({ comment: "   " }))).toBe(
            "Notify web team failed."
        );
    });

    it("is null for a step a person reviews, and for steps that are neither running nor failed", () => {
        const person = createStep({
            state: StepState.InReview,
            owner: LUKA,
            startedOn: at(14, 20)
        });
        expect(getStepRunMessage(person)).toBeNull();
        expect(getStepRunMessage(createRunningAiStep({ state: StepState.Approved }))).toBeNull();
        expect(
            getStepRunMessage(createRunningAiStep({ state: StepState.Awaiting, owner: null }))
        ).toBeNull();
        expect(
            getStepRunMessage(createRunningAiStep({ state: StepState.Pending, owner: null }))
        ).toBeNull();
    });
});

describe("getStepTagTooltip (R264)", () => {
    it("explains a running step", () => {
        expect(getStepTagTooltip(createRunningAiStep())).toBe(
            "AI tone check is running since 14:20."
        );
    });

    it("explains a failed step", () => {
        expect(getStepTagTooltip(createFailedAutomationStep())).toBe(
            "Notify web team failed. The requester or an operator can restart it."
        );
    });

    it("explains a failed step without a reason the same way", () => {
        expect(getStepTagTooltip(createFailedAutomationStep({ comment: null }))).toBe(
            "Notify web team failed. The requester or an operator can restart it."
        );
    });

    it("is null for every other step and for a running step without a start time", () => {
        const person = createStep({
            state: StepState.InReview,
            owner: LUKA,
            startedOn: at(14, 20)
        });
        expect(getStepTagTooltip(person)).toBeNull();
        expect(getStepTagTooltip(createRunningAiStep({ state: StepState.Approved }))).toBeNull();
        expect(getStepTagTooltip(createRunningAiStep({ startedOn: null }))).toBeNull();
    });
});

describe("getStepStateTag with running (R263)", () => {
    it("is 'Running' with the progress_activity icon for a running in-review step", () => {
        expect(getStepStateTag(StepState.InReview, true)).toEqual({
            label: "Running",
            variant: "accent-light",
            icon: "progress_activity"
        });
    });

    it("gives 'In review' the rate_review icon for a step a person reviews", () => {
        expect(getStepStateTag(StepState.InReview, false)).toEqual({
            label: "In review",
            variant: "accent-light",
            icon: "rate_review"
        });
        expect(getStepStateTag(StepState.InReview)).toEqual({
            label: "In review",
            variant: "accent-light",
            icon: "rate_review"
        });
    });

    it("ignores running for every other state and keeps Failed with sync_problem (R263)", () => {
        expect(getStepStateTag(StepState.Failed, true)).toEqual({
            label: "Failed",
            variant: "destructive-light",
            icon: "sync_problem"
        });
        expect(getStepStateTag(StepState.Approved, true)).toEqual({
            label: "Approved",
            variant: "success-light"
        });
    });
});
