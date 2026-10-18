import { isRecord } from "~/editor/model/isRecord.js";
import type { AssignmentValue } from "./AssignmentValue.js";
import type { RuleValue } from "./RuleValue.js";

function conditionsToConfig(rule: RuleValue): Record<string, unknown> {
    const conditions: Record<string, unknown> = {};
    const preserved = rule.preserved.conditions;
    if (isRecord(preserved)) {
        Object.assign(conditions, preserved);
    }
    if (rule.requesterUserId !== null) {
        conditions.requesterUserId = rule.requesterUserId;
    }
    if (rule.requesterTeamId !== null) {
        conditions.requesterTeamId = rule.requesterTeamId;
    }
    if (rule.folder !== null) {
        conditions.folder = {
            id: rule.folder.id,
            type: rule.folder.type,
            includeDescendants: rule.folder.includeDescendants
        };
    }
    return conditions;
}

function ruleToConfig(rule: RuleValue): Record<string, unknown> {
    const config: Record<string, unknown> = {};
    // The preserved keys first: the known keys below always win over them.
    Object.assign(config, rule.preserved);
    config.id = rule.id;
    config.conditions = conditionsToConfig(rule);
    if (rule.target !== null) {
        config.target = { type: rule.target.type, id: rule.target.id };
    }
    return config;
}

/*
 * The stored shape of an assignment (R293, R295): every key and condition the editor does not edit
 * is written back unchanged, an absent optional condition is omitted (never `null`), `conditions`
 * is always an object because the server requires it. Called only by `getPeopleStepPatch`.
 */
export const assignmentToConfig = (value: AssignmentValue): Record<string, unknown> => {
    const config: Record<string, unknown> = {};
    Object.assign(config, value.preserved);
    if (value.strategy !== null) {
        config.strategy = value.strategy;
    }
    config.allowManualPick = value.allowManualPick;
    config.rules = value.rules.map(ruleToConfig);
    return config;
};
