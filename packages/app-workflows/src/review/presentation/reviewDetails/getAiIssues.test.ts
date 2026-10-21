import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getAiIssues } from "./getAiIssues.js";
import type { ReviewAiIssue } from "~/review/domain/types.js";
import { createStep } from "~/review/testing/createStep.js";

const issue = (overrides: Partial<ReviewAiIssue> = {}): ReviewAiIssue => {
    return {
        fieldPath: "body",
        severity: "error",
        message: "Tone is too casual.",
        suggestion: "Use a formal greeting.",
        ...overrides
    };
};

describe("getAiIssues (R264)", () => {
    it("shows the severity label, the field, the message and the suggestion line", () => {
        const step = createStep({ issues: [issue()] });

        expect(getAiIssues(step)).toEqual([
            {
                severityLabel: "Error",
                severityVariant: "neutral-base-outline",
                field: "body",
                message: "Tone is too casual.",
                suggestion: "Suggestion: Use a formal greeting."
            }
        ]);
    });

    it("labels the three severities and shows any other value as is", () => {
        const step = createStep({
            issues: [
                issue({ severity: "error" }),
                issue({ severity: "warning" }),
                issue({ severity: "info" }),
                issue({ severity: "critical" })
            ]
        });

        expect(getAiIssues(step).map(item => item.severityLabel)).toEqual([
            "Error",
            "Warning",
            "Info",
            "critical"
        ]);
    });

    it("gives a warning the warning tag and every other severity the neutral one", () => {
        const step = createStep({
            issues: [
                issue({ severity: "warning" }),
                issue({ severity: "error" }),
                issue({ severity: "info" }),
                issue({ severity: "critical" })
            ]
        });

        expect(getAiIssues(step).map(item => item.severityVariant)).toEqual([
            "warning",
            "neutral-base-outline",
            "neutral-base-outline",
            "neutral-base-outline"
        ]);
    });

    it("says 'Whole content' for an issue without a field", () => {
        const step = createStep({
            issues: [issue({ fieldPath: null }), issue({ fieldPath: "  " })]
        });

        expect(getAiIssues(step).map(item => item.field)).toEqual([
            "Whole content",
            "Whole content"
        ]);
    });

    it("says '—' for an issue without a suggestion", () => {
        const step = createStep({
            issues: [issue({ suggestion: null }), issue({ suggestion: "" })]
        });

        expect(getAiIssues(step).map(item => item.suggestion)).toEqual(["—", "—"]);
    });

    it("keeps the order and returns nothing for a step without issues", () => {
        const step = createStep({
            issues: [issue({ message: "First." }), issue({ message: "Second." })]
        });

        expect(getAiIssues(step).map(item => item.message)).toEqual(["First.", "Second."]);
        expect(getAiIssues(createStep())).toEqual([]);
    });
});
