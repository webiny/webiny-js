import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
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
    it("carries the read-only flag and the warnings", () => {
        const card = buildStepCardVm(
            params({ readOnly: true, warnings: ["Editors has no members."] })
        );

        expect(card.readOnly).toBe(true);
        expect(card.warnings).toEqual(["Editors has no members."]);
    });
});
