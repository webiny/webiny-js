import { describe, expect, it } from "vitest";
import { CANONICAL_SLOTS } from "@webiny/theme-common";
import {
    isUsableAssignment,
    MIN_ACCEPTED_ASSIGNMENTS,
    modelAssignmentSchema,
    validateAssignment,
    type ModelAssignment
} from "./tokenAssignment.js";

const assignment = (overrides: Partial<ModelAssignment> = {}): ModelAssignment => ({
    tokens: {},
    uncertain: [],
    summary: "Extracted from northbeam.io.",
    confidence: "medium",
    ...overrides
});

describe("modelAssignmentSchema", () => {
    it("accepts a well-formed answer", () => {
        const result = modelAssignmentSchema.safeParse({
            tokens: {
                "color.surface.page": "#ffffff",
                "type.body": { fontFamily: "Inter", fontSize: "16px" }
            },
            darkTokens: { "color.surface.page": "#0f172a" },
            uncertain: [{ path: "color.action.primary.background", reason: "Two blues competed." }],
            summary: "A blue-on-white SaaS palette.",
            confidence: "high"
        });

        expect(result.success).toBe(true);
    });

    it("requires the honesty fields", () => {
        // A model asked only for tokens always produces tokens; asked what it was unsure of, it
        // distinguishes a confident read from the least-bad of four greys.
        expect(modelAssignmentSchema.safeParse({ tokens: {} }).success).toBe(false);
        expect(
            modelAssignmentSchema.safeParse({ tokens: {}, uncertain: [], summary: "x" }).success
        ).toBe(false);
    });

    it("rejects an unknown confidence level", () => {
        expect(
            modelAssignmentSchema.safeParse(assignment({ confidence: "certain" as never })).success
        ).toBe(false);
    });

    it("rejects unexpected typography properties rather than silently dropping them", () => {
        const result = modelAssignmentSchema.safeParse(
            assignment({ tokens: { "type.body": { fontFamily: "Inter", colour: "red" } as never } })
        );

        expect(result.success).toBe(false);
    });

    it("allows a numeric font weight or line height", () => {
        const result = modelAssignmentSchema.safeParse(
            assignment({ tokens: { "type.body": { fontWeight: 600, lineHeight: 1.5 } } })
        );

        expect(result.success).toBe(true);
    });
});

describe("validateAssignment", () => {
    it("accepts scalar values on scalar slots", () => {
        const result = validateAssignment(
            assignment({
                tokens: {
                    "color.surface.page": "#ffffff",
                    "space.md": "16px",
                    "shadow.md": "0 4px 8px rgba(0,0,0,.1)"
                }
            })
        );

        expect(result.accepted.map(entry => entry.path)).toEqual([
            "color.surface.page",
            "space.md",
            "shadow.md"
        ]);
        expect(result.rejected).toEqual([]);
    });

    it("accepts a composite object on a typography slot", () => {
        const result = validateAssignment(
            assignment({ tokens: { "type.body": { fontFamily: "Inter", fontSize: "16px" } } })
        );

        expect(result.accepted).toHaveLength(1);
        expect(result.accepted[0].type).toBe("typography");
    });

    it("rejects a path that is not a canonical slot, and says why", () => {
        const result = validateAssignment(
            assignment({ tokens: { "color.brand.tertiary": "#ff0000" } })
        );

        expect(result.accepted).toEqual([]);
        expect(result.rejected[0].reason).toContain("not a canonical token slot");
        expect(result.rejected[0].reason).toContain("color.brand.tertiary");
    });

    it("keeps the good entries when one is bad", () => {
        // One hallucinated path must not cost the user the correct ones — and because unassigned slots
        // fall back to defaults, dropping it degrades the theme by exactly that slot.
        const result = validateAssignment(
            assignment({
                tokens: {
                    "color.surface.page": "#ffffff",
                    "color.invented.slot": "#000000",
                    "space.md": "16px"
                }
            })
        );

        expect(result.accepted).toHaveLength(2);
        expect(result.rejected).toHaveLength(1);
    });

    it("rejects a scalar on a typography slot", () => {
        const result = validateAssignment(assignment({ tokens: { "type.body": "16px Inter" } }));

        expect(result.accepted).toEqual([]);
        expect(result.rejected[0].reason).toContain("needs an object of font properties");
    });

    it("rejects an object on a colour slot", () => {
        const result = validateAssignment(
            assignment({ tokens: { "color.surface.page": { fontFamily: "Inter" } } })
        );

        expect(result.rejected[0].reason).toContain("needs a non-empty string");
    });

    it("rejects an empty string", () => {
        const result = validateAssignment(assignment({ tokens: { "color.surface.page": "   " } }));
        expect(result.rejected).toHaveLength(1);
    });

    it("accepts dark values for colour and shadow slots", () => {
        const result = validateAssignment(
            assignment({
                tokens: {},
                darkTokens: { "color.surface.page": "#0f172a", "shadow.md": "0 4px 8px #000" }
            })
        );

        expect(result.darkAccepted).toHaveLength(2);
        expect(result.darkRejected).toEqual([]);
    });

    it("refuses a dark value on a slot that cannot vary by mode", () => {
        // A dark-mode font size is a category error, and storing one would give the dark theme a
        // different layout from the light one.
        const result = validateAssignment(
            assignment({ tokens: {}, darkTokens: { "space.md": "20px" } })
        );

        expect(result.darkAccepted).toEqual([]);
        expect(result.darkRejected[0].reason).toContain("does not vary between light and dark");
    });

    it("refuses a dark value on an unknown path", () => {
        const result = validateAssignment(
            assignment({ tokens: {}, darkTokens: { "color.nope": "#000000" } })
        );

        expect(result.darkRejected[0].reason).toContain("not a canonical token slot");
    });

    it("accepts every canonical slot when the model fills them all", () => {
        // Guards against the validator disagreeing with the canonical list it validates against.
        const tokens: ModelAssignment["tokens"] = {};
        for (const slot of CANONICAL_SLOTS) {
            tokens[slot.path] = slot.type === "typography" ? { fontFamily: "Inter" } : "value";
        }

        const result = validateAssignment(assignment({ tokens }));

        expect(result.rejected).toEqual([]);
        expect(result.accepted).toHaveLength(CANONICAL_SLOTS.length);
    });

    it("handles an answer that assigned nothing", () => {
        const result = validateAssignment(assignment());

        expect(result).toEqual({
            accepted: [],
            rejected: [],
            darkAccepted: [],
            darkRejected: []
        });
    });
});

describe("isUsableAssignment", () => {
    const withAccepted = (count: number) => {
        const tokens: ModelAssignment["tokens"] = {};
        for (const slot of CANONICAL_SLOTS.slice(0, count)) {
            tokens[slot.path] = slot.type === "typography" ? { fontFamily: "Inter" } : "value";
        }
        return validateAssignment(assignment({ tokens }));
    };

    it("rejects an answer that assigned almost nothing", () => {
        // A theme that is 95% defaults is worse than an error, because it looks like a result.
        expect(isUsableAssignment(withAccepted(MIN_ACCEPTED_ASSIGNMENTS - 1))).toBe(false);
    });

    it("accepts an answer at the threshold", () => {
        expect(isUsableAssignment(withAccepted(MIN_ACCEPTED_ASSIGNMENTS))).toBe(true);
    });

    it("does not count rejected entries towards the threshold", () => {
        const tokens: ModelAssignment["tokens"] = {};
        for (let i = 0; i < 40; i++) {
            tokens[`color.invented.${i}`] = "#000000";
        }

        expect(isUsableAssignment(validateAssignment(assignment({ tokens })))).toBe(false);
    });
});
