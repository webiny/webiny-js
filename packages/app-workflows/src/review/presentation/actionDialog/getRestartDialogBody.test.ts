import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getRestartDialogBody } from "./getRestartDialogBody.js";
import { createStep } from "~/review/testing/createStep.js";

describe("getRestartDialogBody", () => {
    it("uses the no-time body when the end time is unparsable", () => {
        const step = createStep({ finishedOn: "not-a-date", comment: null });

        const body = getRestartDialogBody(step);

        expect(body).toBe(
            "Last attempt failed. Restarting runs the step again from the beginning."
        );
    });

    it("keeps the reason and drops the unparsable end time", () => {
        const step = createStep({ finishedOn: "not-a-date", comment: "The model timed out." });

        const body = getRestartDialogBody(step);

        expect(body).toBe(
            "Last attempt failed: The model timed out. Restarting runs the step again from the beginning."
        );
    });

    it("shows the time of a valid end time", () => {
        const step = createStep({ finishedOn: new Date(2026, 9, 16, 10, 51).toISOString() });

        const body = getRestartDialogBody(step);

        expect(body).toContain("Last attempt failed at ");
        expect(body).not.toContain("NaN");
    });
});
