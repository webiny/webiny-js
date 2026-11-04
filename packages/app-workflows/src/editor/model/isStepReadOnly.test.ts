import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createStepTypes } from "~/editor/testing/draftFixtures.js";
import { getStepTypeLabel } from "./getStepTypeLabel.js";
import { isAiEditable } from "./isAiEditable.js";
import { isStepReadOnly } from "./isStepReadOnly.js";

const withoutAiEditor = () => {
    return createStepTypes().map(item => {
        return item.type === "ai" ? { ...item, configSchema: null } : item;
    });
};

describe("isAiEditable (R275)", () => {
    it("needs the ai row to be available and to have a config schema", () => {
        expect(isAiEditable(createStepTypes())).toBe(true);
        expect(isAiEditable(withoutAiEditor())).toBe(false);
        const unavailable = createStepTypes().map(item => {
            return item.type === "ai" ? { ...item, available: false } : item;
        });
        expect(isAiEditable(unavailable)).toBe(false);
        expect(isAiEditable([])).toBe(false);
    });
});

describe("isStepReadOnly (R270, R275, QBZ-47)", () => {
    it("is false for People and Automation steps", () => {
        expect(isStepReadOnly(createReviewStep(), createStepTypes())).toBe(false);
        expect(isStepReadOnly(createAutomationStep(), createStepTypes())).toBe(false);
    });

    it("is false for an AI step while the AI editor exists", () => {
        expect(isStepReadOnly(createAiStep(), createStepTypes())).toBe(false);
    });

    it("is true for an AI step without the AI editor", () => {
        expect(isStepReadOnly(createAiStep(), withoutAiEditor())).toBe(true);
    });

    it("is true for a step of an unknown type", () => {
        const step = createReviewStep({ type: "custom" });

        expect(isStepReadOnly(step, createStepTypes())).toBe(true);
    });
});

describe("getStepTypeLabel (D98)", () => {
    it("uses the UI names for the three known types", () => {
        const types = createStepTypes();

        expect(getStepTypeLabel("review", types)).toBe("People");
        expect(getStepTypeLabel("automation", types)).toBe("Automation");
        expect(getStepTypeLabel("ai", types)).toBe("AI");
    });

    it("uses the server title for an unknown type, then the type id", () => {
        const types = [
            ...createStepTypes(),
            {
                type: "custom",
                title: "Custom check",
                available: true,
                unavailableReason: null,
                configSchema: null
            }
        ];

        expect(getStepTypeLabel("custom", types)).toBe("Custom check");
        expect(getStepTypeLabel("other", types)).toBe("other");
    });
});

const withoutReview = () => {
    return createStepTypes().map(item => {
        return item.type === "review"
            ? { ...item, available: false, unavailableReason: "Teams are not enabled." }
            : item;
    });
};

describe("isStepReadOnly with teams off (R309)", () => {
    it("is true for a People step while the review row is unavailable", () => {
        expect(isStepReadOnly(createReviewStep(), withoutReview())).toBe(true);
    });

    it("keeps Automation and AI steps editable while teams are off", () => {
        expect(isStepReadOnly(createAutomationStep(), withoutReview())).toBe(false);
        expect(isStepReadOnly(createAiStep(), withoutReview())).toBe(false);
    });
});
