import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
import { buildStepCardVm } from "./buildStepCardVm.js";
import type { StepCardParams } from "./buildStepCardVm.js";

const params = (overrides: Partial<StepCardParams> = {}): StepCardParams => {
    return {
        step: createReviewStep(),
        index: 0,
        count: 1,
        typeLabel: "People",
        summary: "Editors",
        warnings: [],
        errors: [],
        ruleIds: [],
        readOnly: false,
        ...overrides
    };
};

describe("buildStepCardVm", () => {
    it("numbers the card from its index and passes the texts through", () => {
        expect(buildStepCardVm(params({ index: 2, count: 4 }))).toEqual({
            id: "step-1",
            number: 3,
            title: "Legal sign-off",
            color: "var(--color-primary-500)",
            typeLabel: "People",
            type: "review",
            summary: "Editors",
            readOnly: false,
            warnings: [],
            error: null,
            canMoveUp: true,
            canMoveDown: true
        });
    });

    it("cannot move the first card up or the last card down", () => {
        const first = buildStepCardVm(params({ index: 0, count: 3 }));
        const last = buildStepCardVm(params({ index: 2, count: 3 }));
        const only = buildStepCardVm(params({ index: 0, count: 1 }));

        expect([first.canMoveUp, first.canMoveDown]).toEqual([false, true]);
        expect([last.canMoveUp, last.canMoveDown]).toEqual([true, false]);
        expect([only.canMoveUp, only.canMoveDown]).toEqual([false, false]);
    });

    it("says Untitled step and uses the neutral colour for empty values", () => {
        const card = buildStepCardVm(params({ step: createReviewStep({ title: " ", color: "" }) }));

        expect(card.title).toBe("Untitled step");
        expect(card.color).toBe("var(--color-neutral-500)");
    });

    it("shows the first error of the step as the strip", () => {
        const card = buildStepCardVm(
            params({
                errors: [
                    { field: "title", message: "Enter a title for this step.", ruleId: null },
                    {
                        field: "color",
                        message: "Enter a hex colour, e.g. #3B6FD4.",
                        ruleId: null
                    }
                ]
            })
        );

        expect(card.error).toBe("Enter a title for this step.");
    });

    it("prefixes the strip of a rule error with the rule's current position (R303)", () => {
        const errors = [
            {
                field: "config.assignment.rules.target",
                message: "Choose who this rule assigns to.",
                ruleId: "r-b"
            }
        ];

        const before = buildStepCardVm(params({ errors, ruleIds: ["r-a", "r-b", "r-c"] }));
        const reordered = buildStepCardVm(params({ errors, ruleIds: ["r-b", "r-c", "r-a"] }));

        expect(before.error).toBe("Rule 2: Choose who this rule assigns to.");
        expect(reordered.error).toBe("Rule 1: Choose who this rule assigns to.");
    });

    it("shows the plain message when the rule is gone or the error names no rule", () => {
        const gone = buildStepCardVm(
            params({
                errors: [
                    { field: "config.assignment.rules.target", message: "Gone.", ruleId: "r-x" }
                ],
                ruleIds: ["r-a"]
            })
        );
        const none = buildStepCardVm(
            params({
                errors: [{ field: "config.assignment.rules", message: "Odd.", ruleId: null }],
                ruleIds: ["r-a"]
            })
        );

        expect(gone.error).toBe("Gone.");
        expect(none.error).toBe("Odd.");
    });
    it("carries the read-only flag and the warning lines with their severity", () => {
        const lines: StepWarningLine[] = [
            { text: "Editors has no members.", severity: "warning" },
            { text: "Rule 1: The assigned user was deleted.", severity: "error" }
        ];
        const card = buildStepCardVm(params({ readOnly: true, warnings: lines }));

        expect(card.readOnly).toBe(true);
        expect(card.warnings).toEqual(lines);
    });

    it("does not show a live error twice when the strip already says it (R299)", () => {
        const card = buildStepCardVm(
            params({
                ruleIds: ["r1", "r2"],
                warnings: [
                    { text: "Rule 1: Choose who this rule assigns to.", severity: "error" },
                    { text: "Rule 2: The folder no longer exists.", severity: "warning" }
                ],
                errors: [
                    {
                        field: "config.assignment.rules.target",
                        message: "Choose who this rule assigns to.",
                        ruleId: "r1"
                    }
                ]
            })
        );

        expect(card.error).toBe("Rule 1: Choose who this rule assigns to.");
        expect(card.warnings).toEqual([
            { text: "Rule 2: The folder no longer exists.", severity: "warning" }
        ]);
    });

    it("lets a server error replace the live error of its own rule only (R303)", () => {
        const card = buildStepCardVm(
            params({
                ruleIds: ["r1", "r2"],
                warnings: [
                    {
                        text: "Rule 1: Ana Kovac is no longer in the reviewing teams.",
                        severity: "error"
                    },
                    { text: "Rule 1: The folder no longer exists.", severity: "warning" },
                    { text: "Rule 2: The team was deleted.", severity: "error" }
                ],
                errors: [
                    {
                        field: "config.assignment.rules.target",
                        message: "The target user is not a member of the step's teams.",
                        ruleId: "r1"
                    }
                ]
            })
        );

        expect(card.error).toBe("Rule 1: The target user is not a member of the step's teams.");
        expect(card.warnings).toEqual([
            { text: "Rule 1: The folder no longer exists.", severity: "warning" },
            { text: "Rule 2: The team was deleted.", severity: "error" }
        ]);
    });

    it("keeps every line when the strip is another field's error", () => {
        const lines: StepWarningLine[] = [
            { text: "Rule 1: The folder no longer exists.", severity: "warning" },
            { text: "Rule 2: The team was deleted.", severity: "error" }
        ];
        const card = buildStepCardVm(
            params({
                ruleIds: ["r1", "r2"],
                warnings: lines,
                errors: [{ field: "title", message: "Enter a title for this step.", ruleId: null }]
            })
        );

        expect(card.error).toBe("Enter a title for this step.");
        expect(card.warnings).toEqual(lines);
    });
});
