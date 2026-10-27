import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { EditorStep } from "~/editor/domain/types.js";
import { isRecord } from "./isRecord.js";
import { readReviewConfig } from "./readReviewConfig.js";

/*
 * The stored ids of a People step's rules, in order, one entry per rule (an empty string for a rule
 * without an id, so positions stay aligned). It never creates ids: the step card only needs the
 * position of a rule an error names (R303). Pure.
 */
export const getStepRuleIds = (step: EditorStep): string[] => {
    if (step.type !== StepTypeId.Review) {
        return [];
    }
    const assignment = readReviewConfig(step.config).assignment;
    if (assignment === null || !Array.isArray(assignment.rules)) {
        return [];
    }
    const ids: string[] = [];
    for (const rule of assignment.rules) {
        const id = isRecord(rule) ? rule.id : undefined;
        ids.push(typeof id === "string" ? id : "");
    }
    return ids;
};
