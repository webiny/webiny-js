import { z } from "zod";
import type { AiIssue } from "@webiny/api-workflows/domain/review/types.js";
import { AI_STEP_MAX_ISSUES } from "./constants.js";

const AI_ISSUE_FIELD_PATH_MAX_LENGTH = 500;
const AI_ISSUE_TEXT_MAX_LENGTH = 2000;

const aiReviewIssueSchema = z.object({
    fieldPath: z
        .string()
        .nullable()
        .describe("The path of the field the issue is about, as readTarget returned it, or null."),
    severity: z.enum(["error", "warning", "info"]),
    message: z.string().describe("What is wrong, in one or two sentences."),
    suggestion: z.string().nullable().describe("How to fix it, or null.")
});

/**
 * What the model answers (R171): the decision, the comment (empty is fine for an approval, a
 * rejection needs one) and the issues. No length rules here, because a provider's structured
 * output mode rejects some constraints; `normalizeAiIssues` clamps and caps afterwards.
 */
export const aiReviewOutputSchema = z.object({
    approved: z.boolean().describe("true approves the step, false rejects it."),
    comment: z.string().describe("The reason for the decision. Required when rejecting."),
    issues: z.array(aiReviewIssueSchema).describe("Specific problems found; empty when none.")
});

export type AiReviewOutput = z.infer<typeof aiReviewOutputSchema>;

/**
 * Clamps and caps the issues a model returned (R171). Pure. At most `AI_STEP_MAX_ISSUES` are kept
 * in order and the extras are dropped (the caller logs that); `fieldPath` is clamped to 500
 * characters, `message` and `suggestion` to 2000, `null` stays `null`; only the four keys of an
 * `AiIssue` come back, so nothing else a model sent is stored; the input is not mutated.
 */
export const normalizeAiIssues = (issues: AiIssue[]): AiIssue[] => {
    return issues.slice(0, AI_STEP_MAX_ISSUES).map(issue => {
        return {
            fieldPath:
                issue.fieldPath === null
                    ? null
                    : issue.fieldPath.slice(0, AI_ISSUE_FIELD_PATH_MAX_LENGTH),
            severity: issue.severity,
            message: issue.message.slice(0, AI_ISSUE_TEXT_MAX_LENGTH),
            suggestion:
                issue.suggestion === null
                    ? null
                    : issue.suggestion.slice(0, AI_ISSUE_TEXT_MAX_LENGTH)
        };
    });
};
