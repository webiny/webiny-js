import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { getReviewToastText } from "./getReviewToastText.js";

describe("getReviewToastText (QBZ-93, QBZ-82)", () => {
    it("requested: names the first step", () => {
        expect(
            getReviewToastText({
                kind: "requested",
                stepTitle: "Editorial check",
                personName: null,
                reviewsUrl: null
            })
        ).toEqual({
            title: "Review requested",
            description: "Editorial check is the first step."
        });
    });

    it("started: names the step and says where it went", () => {
        expect(
            getReviewToastText({
                kind: "started",
                stepTitle: "Draft check",
                personName: null,
                reviewsUrl: null
            })
        ).toEqual({
            title: "Started “Draft check”",
            description: "It’s now in Assigned to me."
        });
    });

    it("restarted: names the step and says it is running again (QBZ-93)", () => {
        expect(
            getReviewToastText({
                kind: "restarted",
                stepTitle: "AI tone check",
                personName: null,
                reviewsUrl: null
            })
        ).toEqual({
            title: "Restarted “AI tone check”",
            description: "The step is running again."
        });
    });

    it("approved: names the next step when there is one", () => {
        expect(
            getReviewToastText({
                kind: "approved",
                stepTitle: "Draft check",
                personName: null,
                reviewsUrl: null,
                nextStepTitle: "Legal check"
            })
        ).toEqual({
            title: "Approved “Draft check”",
            description: "Next: Legal check."
        });
    });

    it("approved: says the content is ready when it was the last step", () => {
        expect(
            getReviewToastText({
                kind: "approved",
                stepTitle: "Draft check",
                personName: null,
                reviewsUrl: null,
                nextStepTitle: null
            })
        ).toEqual({
            title: "Approved “Draft check”",
            description: "All steps approved. It’s ready to publish."
        });
    });

    it("rejected: tells the requester is notified", () => {
        expect(
            getReviewToastText({
                kind: "rejected",
                stepTitle: "Draft check",
                personName: null,
                reviewsUrl: null
            })
        ).toEqual({
            title: "Rejected “Draft check”",
            description: "The requester is notified."
        });
    });

    it("tookOver: names who was notified when notify was ticked", () => {
        expect(
            getReviewToastText({
                kind: "tookOver",
                stepTitle: "Draft check",
                personName: "Ada Lovelace",
                reviewsUrl: null
            })
        ).toEqual({
            title: "Took over “Draft check”",
            description: "Ada Lovelace was notified."
        });
    });

    it("tookOver: has no body when notify was not ticked", () => {
        expect(
            getReviewToastText({
                kind: "tookOver",
                stepTitle: "Draft check",
                personName: null,
                reviewsUrl: null
            })
        ).toEqual({ title: "Took over “Draft check”", description: null });
    });

    it("reassigned: names the new owner and says both are notified", () => {
        expect(
            getReviewToastText({
                kind: "reassigned",
                stepTitle: "Draft check",
                personName: "Grace Hopper",
                reviewsUrl: null
            })
        ).toEqual({
            title: "Reassigned “Draft check” to Grace Hopper",
            description: "Both the previous and the new owner are notified."
        });
    });

    it("cancelled: says editing is unlocked", () => {
        expect(
            getReviewToastText({
                kind: "cancelled",
                stepTitle: null,
                personName: null,
                reviewsUrl: null
            })
        ).toEqual({ title: "Review cancelled", description: "Editing is unlocked." });
    });
});
