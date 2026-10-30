import type { ReviewAiIssue } from "~/review/domain/types.js";
import type { ReviewStep } from "~/review/domain/types.js";
import type { TargetReviewTagVariant } from "../targetReview/abstractions.js";
import type { ReviewAiIssueVm } from "./abstractions.js";
import type { ReviewFieldLabels } from "./abstractions.js";

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
    if (severity === "error") {
        return "destructive";
    }
    if (severity === "warning") {
        return "warning";
    }
    return "neutral-base-outline";
};

// The first path segment is the field id: it takes the field's label; the rest stays as is.
const getFieldName = (fieldPath: string, fieldLabels: ReviewFieldLabels): string => {
    const [fieldId, ...rest] = fieldPath.split(".");
    // Own keys only: the path comes from the AI, so "constructor" must not hit Object.prototype.
    const known = Object.hasOwn(fieldLabels, fieldId) && fieldLabels[fieldId] !== "";
    const label = known ? fieldLabels[fieldId] : fieldId;
    return [label, ...rest].join(" › ");
};

const toIssueVm = (issue: ReviewAiIssue, fieldLabels: ReviewFieldLabels): ReviewAiIssueVm => {
    let field = WHOLE_CONTENT;
    if (issue.fieldPath !== null && issue.fieldPath.trim() !== "") {
        field = getFieldName(issue.fieldPath, fieldLabels);
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
export const getAiIssues = (
    step: ReviewStep,
    fieldLabels: ReviewFieldLabels
): ReviewAiIssueVm[] => {
    return step.issues.map(issue => toIssueVm(issue, fieldLabels));
};
