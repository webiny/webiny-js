import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { nextStep } from "~/loop/nextStep.js";
import { CLAIMED_ELSEWHERE_STATUS } from "~/domain/BackgroundTasksLoop.js";
import { HANDED_BACK_STATUS } from "~/domain/BackgroundTasksLoop.js";

describe("nextStep", () => {
    it("continues with the wait in milliseconds and the delay the runner sent back", () => {
        const step = nextStep({ status: "continue", wait: 30, delay: -1 });

        expect(step).toEqual({ kind: "continue", waitMs: 30_000, delay: -1 });
    });

    it("continues at once, with delay -1, when the runner sends neither", () => {
        const step = nextStep({ status: "continue" });

        expect(step).toEqual({ kind: "continue", waitMs: 0, delay: -1 });
    });

    it.each(["done", "aborted", CLAIMED_ELSEWHERE_STATUS, HANDED_BACK_STATUS])(
        "ends quietly on %s",
        status => {
            expect(nextStep({ status })).toEqual({ kind: "end" });
        }
    );

    it("reports an error result as unexpected", () => {
        expect(nextStep({ status: "error" })).toEqual({ kind: "unexpected", status: "error" });
    });

    it("reports a missing result as unexpected", () => {
        expect(nextStep(undefined)).toEqual({ kind: "unexpected", status: undefined });
    });
});
