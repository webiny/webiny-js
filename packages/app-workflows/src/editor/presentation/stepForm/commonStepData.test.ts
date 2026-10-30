import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { getCommonFormData } from "./getCommonFormData.js";
import { getCommonStepPatch } from "./getCommonStepPatch.js";

describe("getCommonFormData", () => {
    it("copies the common fields and turns a null description into an empty one", () => {
        const step = createReviewStep({ notificationIds: ["e-mail", "legacy-sms"] });

        expect(getCommonFormData(step)).toEqual({
            title: "Legal sign-off",
            color: "var(--color-primary-500)",
            description: "",
            notifications: ["e-mail", "legacy-sms"]
        });
    });

    it("does not share the notifications array with the step", () => {
        const step = createReviewStep();

        expect(getCommonFormData(step).notifications).not.toBe(step.notificationIds);
    });
});

describe("getCommonStepPatch (R270, R273, R272)", () => {
    const values = {
        title: "Legal review",
        color: "var(--color-warning-600)",
        description: "Check the claims",
        notifications: ["e-mail"]
    };

    it("writes the four common fields (notifications as notificationIds)", () => {
        expect(getCommonStepPatch(createReviewStep(), values)).toEqual({
            title: "Legal review",
            color: "var(--color-warning-600)",
            description: "Check the claims",
            notificationIds: ["e-mail"]
        });
    });

    it("turns an empty description into null and a missing title or notifications into empty values", () => {
        const patch = getCommonStepPatch(createReviewStep(), {
            title: null,
            color: null,
            description: "",
            notifications: null
        });

        expect(patch).toEqual({
            title: "",
            color: "var(--color-primary-500)",
            description: null,
            notificationIds: []
        });
    });

    it("applies a finished custom hex colour", () => {
        const patch = getCommonStepPatch(createReviewStep(), { ...values, color: "#3B6FD4" });

        expect(patch.color).toBe("#3B6FD4");
    });

    it("keeps the step's colour when the hex is unfinished or the colour was cleared (it never reaches the draft)", () => {
        const step = createReviewStep({ color: "#3B6FD4" });

        expect(getCommonStepPatch(step, { ...values, color: "#3B6" }).color).toBe("#3B6FD4");
        expect(getCommonStepPatch(step, { ...values, color: "" }).color).toBe("#3B6FD4");
    });

    it("keeps unlisted transport ids that the form carries (D151)", () => {
        const patch = getCommonStepPatch(createReviewStep(), {
            ...values,
            notifications: ["legacy-sms", "e-mail"]
        });

        expect(patch.notificationIds).toEqual(["legacy-sms", "e-mail"]);
    });
});
