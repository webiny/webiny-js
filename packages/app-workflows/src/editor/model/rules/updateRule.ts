import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import type { RulePatch } from "./RulePatch.js";

function applyPatch(rule: RuleValue, patch: RulePatch): RuleValue {
    const next: RuleValue = { ...rule };
    if (patch.requesterUserId !== undefined) {
        next.requesterUserId = patch.requesterUserId;
    }
    if (patch.requesterTeamId !== undefined) {
        next.requesterTeamId = patch.requesterTeamId;
    }
    if (patch.folder !== undefined) {
        next.folder = patch.folder;
    }
    if (patch.target !== undefined) {
        next.target = patch.target;
        // A stored target of an unknown type is replaced the moment the admin chooses or clears one.
        const preserved = { ...rule.preserved };
        delete preserved.target;
        next.preserved = preserved;
    }
    return next;
}

/*
 * Merges the defined keys of `patch` into the rule with that id and returns a new list; the id and
 * the other rules are unchanged. An unknown id changes nothing.
 */
export const updateRule = (rules: RuleValue[], ruleId: string, patch: RulePatch): RuleValue[] => {
    return rules.map(rule => {
        if (rule.id !== ruleId) {
            return rule;
        }
        return applyPatch(rule, patch);
    });
};
