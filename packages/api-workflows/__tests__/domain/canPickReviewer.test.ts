import { describe, expect, it } from "vitest";
import { canPickReviewer } from "~/domain/workflow/canPickReviewer.js";
import { createReviewStep } from "~tests/__helpers/fixtures.js";

describe("canPickReviewer", () => {
    it("is true for a review step that allows a manual pick", () => {
        const step = createReviewStep({ id: "legal", title: "Legal", allowManualPick: true });

        expect(canPickReviewer(step)).toBe(true);
    });

    it("is false when the step does not allow a pick", () => {
        const step = createReviewStep({ id: "legal", title: "Legal", allowManualPick: false });

        expect(canPickReviewer(step)).toBe(false);
    });

    it("is false when the config is not a review config", () => {
        const step = {
            ...createReviewStep({ id: "legal", title: "Legal", allowManualPick: true }),
            config: { teams: "team-reviewers" }
        };

        expect(canPickReviewer(step)).toBe(false);
    });

    it("is false for a step that is not a review step", () => {
        const step = {
            ...createReviewStep({ id: "legal", title: "Legal", allowManualPick: true }),
            type: "automation"
        };

        expect(canPickReviewer(step)).toBe(false);
    });
});
