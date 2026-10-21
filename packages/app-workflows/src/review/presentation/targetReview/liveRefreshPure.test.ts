import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getFinishedAutomatedStep } from "./getFinishedAutomatedStep.js";
import { getContentNotice } from "./getContentNotice.js";
import { StepState } from "~/review/domain/StepState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import { createActor } from "~/review/testing/createActor.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";
import { createRunningAiStep } from "~/review/testing/createAutomatedStep.js";
import { createRunningAutomationStep } from "~/review/testing/createAutomatedStep.js";

const LUKA = createActor({ id: "user-2", displayName: "Luka Perić" });

describe("getFinishedAutomatedStep (R262)", () => {
    it("returns the running step that is approved in the next load", () => {
        const previous = createReview({ steps: [createRunningAiStep()] });
        const next = createReview({ steps: [createRunningAiStep({ state: StepState.Approved })] });

        expect(getFinishedAutomatedStep(previous, next)?.id).toBe("step-1");
    });

    it("also returns a step that failed or was rejected", () => {
        const previous = createReview({ steps: [createRunningAiStep()] });

        [StepState.Failed, StepState.Rejected].forEach(state => {
            const next = createReview({ steps: [createRunningAiStep({ state })] });
            expect(getFinishedAutomatedStep(previous, next)?.id).toBe("step-1");
        });
    });

    it("is null while the step is still running", () => {
        const previous = createReview({ steps: [createRunningAiStep()] });
        const next = createReview({ steps: [createRunningAiStep()] });

        expect(getFinishedAutomatedStep(previous, next)).toBeNull();
    });

    it("is null without a previous load (the first load never reloads)", () => {
        const next = createReview({ steps: [createRunningAiStep({ state: StepState.Approved })] });

        expect(getFinishedAutomatedStep(null, next)).toBeNull();
    });

    it("is null when the next load has no review or no such step", () => {
        const previous = createReview({ steps: [createRunningAiStep()] });
        const other = createReview({ steps: [createRunningAiStep({ id: "step-9" })] });

        expect(getFinishedAutomatedStep(previous, null)).toBeNull();
        expect(getFinishedAutomatedStep(previous, other)).toBeNull();
    });

    it("is null for a step a person reviews", () => {
        const person = (state: StepStateValue) => {
            return createStep({ id: "step-1", state, owner: LUKA });
        };
        const previous = createReview({ steps: [person(StepState.InReview)] });
        const next = createReview({ steps: [person(StepState.Approved)] });

        expect(getFinishedAutomatedStep(previous, next)).toBeNull();
    });

    it("is null for a step that was not running before", () => {
        const previous = createReview({
            steps: [createRunningAiStep({ state: StepState.Awaiting, owner: null })]
        });
        const next = createReview({ steps: [createRunningAiStep({ state: StepState.Approved })] });

        expect(getFinishedAutomatedStep(previous, next)).toBeNull();
    });
});

describe("getContentNotice (R262)", () => {
    it("names the step and uses auto_awesome for an AI step", () => {
        expect(getContentNotice(createRunningAiStep())).toEqual({
            text: "Content updated by AI tone check. The editor loaded the latest version.",
            icon: "auto_awesome"
        });
    });

    it("uses bolt for an automation step", () => {
        const step = createRunningAutomationStep();

        expect(getContentNotice(step)).toEqual({
            text: "Content updated by Notify web team. The editor loaded the latest version.",
            icon: "bolt"
        });
    });
});
