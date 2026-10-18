import { isRecord } from "~/editor/model/isRecord.js";
import type { AssignmentValue } from "./AssignmentValue.js";
import type { RuleValue } from "./RuleValue.js";

function conditionsToConfig(rule: RuleValue): unknown {
    const conditions: Record<string, unknown> = {};
    const preserved = rule.preserved.conditions;
    const edited =
        rule.requesterUserId !== null || rule.requesterTeamId !== null || rule.folder !== null;
    // Stored conditions that are not an object are written back as they were, until a condition is set.
    if (preserved !== undefined && !isRecord(preserved) && !edited) {
        return preserved;
    }
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

// The rules as stored: the entries the editor cannot read return to their positions.
function rulesToConfig(value: AssignmentValue): unknown[] {
    const rules: unknown[] = value.rules.map(ruleToConfig);
    const unread = [...(value.unreadRules ?? [])].sort((a, b) => a.index - b.index);
    for (const entry of unread) {
        rules.splice(Math.min(entry.index, rules.length), 0, entry.value);
    }
    return rules;
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
    // A stored `rules` value that is not a list stays as it was until a rule is added.
    const keepRawRules =
        value.preserved.rules !== undefined &&
        value.rules.length === 0 &&
        (value.unreadRules ?? []).length === 0;
    if (!keepRawRules) {
        config.rules = rulesToConfig(value);
    }
    return config;
};
