import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { isStepRunning } from "./isStepRunning.js";
import { StepState } from "~/review/domain/StepState.js";
import { createActor } from "~/review/testing/createActor.js";
import { createStep } from "~/review/testing/createStep.js";

describe("isStepRunning (R263)", () => {
    it("is true for an in-review step owned by an AI", () => {
        const step = createStep({
            state: StepState.InReview,
            owner: createActor({ type: "ai" })
        });

        expect(isStepRunning(step)).toBe(true);
    });

    it("is true for an in-review step owned by an automation", () => {
        const step = createStep({
            state: StepState.InReview,
            owner: createActor({ type: "automation" })
        });

        expect(isStepRunning(step)).toBe(true);
    });

    it("is false for an in-review step owned by a person", () => {
        const step = createStep({
            state: StepState.InReview,
            owner: createActor({ type: "user" })
        });

        expect(isStepRunning(step)).toBe(false);
    });

    it("is false for an in-review step without an owner", () => {
        const step = createStep({ state: StepState.InReview, owner: null });

        expect(isStepRunning(step)).toBe(false);
    });

    it.each([
        StepState.Pending,
        StepState.Awaiting,
        StepState.Approved,
        StepState.Rejected,
        StepState.Failed
    ])("is false for a %s step even with an AI owner", state => {
        const step = createStep({ state, owner: createActor({ type: "ai" }) });

        expect(isStepRunning(step)).toBe(false);
    });
});
