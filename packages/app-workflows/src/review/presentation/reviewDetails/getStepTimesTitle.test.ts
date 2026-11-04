import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createStep } from "~/review/testing/createStep.js";
import { getStepTimesTitle } from "./getStepTimesTitle.js";

const at = (day: number, hour: number, minute: number): string => {
    return new Date(2026, 9, day, hour, minute).toISOString();
};

describe("getStepTimesTitle", () => {
    it("is null for a step that was not reached", () => {
        expect(getStepTimesTitle(createStep())).toBeNull();
    });

    it("is null when the reached date is invalid", () => {
        expect(getStepTimesTitle(createStep({ reachedOn: "not a date" }))).toBeNull();
    });

    it("leaves out a started or finished date that is invalid", () => {
        const step = createStep({
            reachedOn: at(6, 10, 41),
            startedOn: "not a date",
            finishedOn: at(6, 11, 20)
        });

        const result = getStepTimesTitle(step);

        expect(result).toMatch(/^Reached .* · Finished /);
        expect(result).not.toContain("Started");
    });
});
