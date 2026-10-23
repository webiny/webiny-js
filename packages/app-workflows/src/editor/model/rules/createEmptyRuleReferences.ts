import type { RuleReferences } from "./RuleReferences.js";

// Nothing resolved: no label, so no reference issue. The presenter starts from this (Task 14).
export const createEmptyRuleReferences = (): RuleReferences => {
    return {
        users: new Map(),
        teams: new Map(),
        folders: new Map(),
        userTeamIds: new Map()
    };
};
