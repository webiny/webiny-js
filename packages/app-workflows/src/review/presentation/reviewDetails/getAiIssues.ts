import type { ReviewAiIssue } from "~/review/domain/types.js";
import type { ReviewStep } from "~/review/domain/types.js";
import type { TargetReviewTagVariant } from "../targetReview/abstractions.js";
import type { ReviewAiIssueVm } from "./abstractions.js";

const WHOLE_CONTENT = "Whole content";
const NO_SUGGESTION = "—";

const getSeverityLabel = (severity: string): string => {
    switch (severity) {
        case "error":
            return "Error";
        case "warning":
            return "Warning";
        case "info":
            return "Info";
        default:
            return severity;
    }
};

const getSeverityVariant = (severity: string): TargetReviewTagVariant => {
    if (severity === "warning") {
        return "warning";
    }
    return "neutral-base-outline";
};

const toIssueVm = (issue: ReviewAiIssue): ReviewAiIssueVm => {
    let field = WHOLE_CONTENT;
    if (issue.fieldPath !== null && issue.fieldPath.trim() !== "") {
        field = issue.fieldPath;
    }
    let suggestion = NO_SUGGESTION;
    if (issue.suggestion !== null && issue.suggestion !== "") {
        suggestion = `Suggestion: ${issue.suggestion}`;
    }

    return {
        severityLabel: getSeverityLabel(issue.severity),
        severityVariant: getSeverityVariant(issue.severity),
        field,
        message: issue.message,
        suggestion
    };
};

// The issues an AI step reported, in the design's table cells (R264). Pure.
export const getAiIssues = (step: ReviewStep): ReviewAiIssueVm[] => {
    return step.issues.map(toIssueVm);
};
