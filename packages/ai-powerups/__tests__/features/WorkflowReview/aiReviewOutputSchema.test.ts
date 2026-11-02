import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { AiIssue } from "@webiny/api-workflows/domain/review/types.js";
import {
    aiReviewOutputSchema,
    normalizeAiIssues
} from "~/api/features/WorkflowReview/aiReviewOutputSchema.js";
import { AI_STEP_MAX_ISSUES } from "~/api/features/WorkflowReview/constants.js";

const createIssue = (overrides: Partial<AiIssue> = {}): AiIssue => {
    return {
        fieldPath: "bio",
        severity: "warning",
        message: "The bio is short.",
        suggestion: "Add a sentence.",
        ...overrides
    };
};

describe("aiReviewOutputSchema (R171)", () => {
    it("accepts an approval without issues", () => {
        const parsed = aiReviewOutputSchema.safeParse({
            approved: true,
            comment: "",
            issues: []
        });

        expect(parsed.success).toBe(true);
    });

    it("accepts a rejection with an issue that has null path and suggestion", () => {
        const parsed = aiReviewOutputSchema.safeParse({
            approved: false,
            comment: "The title is misleading.",
            issues: [createIssue({ fieldPath: null, suggestion: null, severity: "error" })]
        });

        expect(parsed.success).toBe(true);
        expect(parsed.data?.issues[0]).toEqual({
            fieldPath: null,
            severity: "error",
            message: "The bio is short.",
            suggestion: null
        });
    });

    it.each([
        ["no approved", { comment: "", issues: [] }],
        ["a string approved", { approved: "yes", comment: "", issues: [] }],
        ["no comment", { approved: true, issues: [] }],
        ["a non-string comment", { approved: true, comment: 1, issues: [] }],
        ["no issues", { approved: true, comment: "" }],
        ["issues that are not a list", { approved: true, comment: "", issues: {} }],
        [
            "an unknown severity",
            { approved: true, comment: "", issues: [createIssue({ severity: "fatal" as never })] }
        ],
        [
            "an issue without a message",
            {
                approved: true,
                comment: "",
                issues: [{ fieldPath: null, severity: "info", suggestion: null }]
            }
        ],
        ["null", null],
        ["a string", "approved"]
    ])("refuses %s", (_name, value) => {
        expect(aiReviewOutputSchema.safeParse(value).success).toBe(false);
    });

    it("converts to a JSON schema (the AI SDK sends it to the provider)", () => {
        const jsonSchema = z.toJSONSchema(aiReviewOutputSchema, { io: "output" });

        expect(jsonSchema).toMatchObject({
            type: "object",
            required: expect.arrayContaining(["approved", "comment", "issues"])
        });
    });
});

describe("normalizeAiIssues (R171)", () => {
    it("returns an empty list for no issues", () => {
        expect(normalizeAiIssues([])).toEqual([]);
    });

    it("keeps valid issues unchanged and in order", () => {
        const issues = [createIssue({ message: "first" }), createIssue({ message: "second" })];

        expect(normalizeAiIssues(issues)).toEqual(issues);
    });

    it("keeps at most AI_STEP_MAX_ISSUES issues and drops the extras", () => {
        const issues = Array.from({ length: AI_STEP_MAX_ISSUES + 7 }, (_, index) => {
            return createIssue({ message: `issue ${index}` });
        });

        const normalized = normalizeAiIssues(issues);

        expect(normalized).toHaveLength(AI_STEP_MAX_ISSUES);
        expect(normalized[0].message).toBe("issue 0");
        expect(normalized[AI_STEP_MAX_ISSUES - 1].message).toBe(`issue ${AI_STEP_MAX_ISSUES - 1}`);
    });

    it("keeps exactly AI_STEP_MAX_ISSUES issues", () => {
        const issues = Array.from({ length: AI_STEP_MAX_ISSUES }, () => createIssue());

        expect(normalizeAiIssues(issues)).toHaveLength(AI_STEP_MAX_ISSUES);
    });

    it("clamps fieldPath to 500 characters", () => {
        const normalized = normalizeAiIssues([createIssue({ fieldPath: "p".repeat(501) })]);

        expect(normalized[0].fieldPath).toBe("p".repeat(500));
    });

    it("clamps message and suggestion to 2000 characters", () => {
        const normalized = normalizeAiIssues([
            createIssue({ message: "m".repeat(2001), suggestion: "s".repeat(2001) })
        ]);

        expect(normalized[0].message).toBe("m".repeat(2000));
        expect(normalized[0].suggestion).toBe("s".repeat(2000));
    });

    it("leaves values at the limits unchanged", () => {
        const issue = createIssue({
            fieldPath: "p".repeat(500),
            message: "m".repeat(2000),
            suggestion: "s".repeat(2000)
        });

        expect(normalizeAiIssues([issue])).toEqual([issue]);
    });

    it("keeps a null fieldPath and a null suggestion null", () => {
        const normalized = normalizeAiIssues([createIssue({ fieldPath: null, suggestion: null })]);

        expect(normalized[0].fieldPath).toBeNull();
        expect(normalized[0].suggestion).toBeNull();
    });

    it("returns only the four keys of an issue", () => {
        const withExtras = {
            ...createIssue(),
            confidence: 0.9,
            rawModelOutput: "secret"
        } as AiIssue;

        const normalized = normalizeAiIssues([withExtras]);

        expect(Object.keys(normalized[0]).sort()).toEqual([
            "fieldPath",
            "message",
            "severity",
            "suggestion"
        ]);
    });

    it("does not mutate its input", () => {
        const issues = [createIssue({ message: "m".repeat(2500) })];
        const copy = structuredClone(issues);

        normalizeAiIssues(issues);

        expect(issues).toEqual(copy);
    });
});
