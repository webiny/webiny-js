import type { EditorStep } from "~/editor/domain/types.js";
import { readAssignment } from "~/editor/model/assignment/readAssignment.js";
import { readReviewConfig } from "~/editor/model/readReviewConfig.js";
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
import type { ValidationFailure } from "./mapSaveError.js";

const RULES_FIELD = "config.assignment.rules";
const INDEXED_RULE_FIELD = /^config\.assignment\.rules\.(\d+)(?:\.(.+))?$/;

/*
 * The step errors of a validation failure that names a step (R303). A rule-level failure arrives with
 * its `ruleId`. A schema failure arrives as `config.assignment.rules.<index>.<path>`: the index is
 * converted here to the id of the rule at that index of the step as it was sent, and dropped from
 * the field, so a later reorder keeps the error on its rule. The index counts the stored rules,
 * unreadable ones included; an index with no readable rule leaves `ruleId` null and the error is
 * shown at the top of the drawer. Pure.
 */
export const getRuleErrorsFromSave = (
    failure: ValidationFailure,
    step: EditorStep | null
): StepFieldError[] => {
    const field = failure.field ?? "";
    const match = INDEXED_RULE_FIELD.exec(field);
    if (match === null) {
        return [{ field, message: failure.message, ruleId: failure.ruleId }];
    }

    const index = Number(match[1]);
    const path = match[2];
    const normalised = path === undefined ? RULES_FIELD : `${RULES_FIELD}.${path}`;
    let ruleId = failure.ruleId;
    if (ruleId === null && step !== null) {
        const config = readReviewConfig(step.config);
        const assignment = readAssignment(config.assignment);
        const unreadRules = assignment.unreadRules ?? [];
        // The index counts every stored rule; the readable list skips the unreadable ones.
        const pointsAtUnread = unreadRules.some(unread => unread.index === index);
        const unreadBefore = unreadRules.filter(unread => unread.index < index).length;
        const rule = pointsAtUnread ? undefined : assignment.rules[index - unreadBefore];
        ruleId = rule === undefined ? null : rule.id;
    }
    return [{ field: normalised, message: failure.message, ruleId }];
};
