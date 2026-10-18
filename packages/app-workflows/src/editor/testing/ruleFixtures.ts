import type { AssignmentValue } from "~/editor/model/assignment/AssignmentValue.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import type { ReferenceLabel } from "~/editor/model/rules/ReferenceLabel.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";

// A rule with no conditions that assigns to the pool of `team-1`.
export const createRuleValue = (overrides: Partial<RuleValue> = {}): RuleValue => {
    return {
        id: "rule-1",
        requesterUserId: null,
        requesterTeamId: null,
        folder: null,
        target: { type: "team", id: "team-1" },
        preserved: {},
        ...overrides
    };
};

// The assignment of a new People step: strategy none, no pick, no rules.
export const createAssignmentValue = (
    overrides: Partial<AssignmentValue> = {}
): AssignmentValue => {
    return {
        strategy: "none",
        allowManualPick: false,
        rules: [],
        preserved: {},
        ...overrides
    };
};

// A found user `user-1` named "Ivan Horvat" unless overridden.
export const createReferenceLabel = (overrides: Partial<ReferenceLabel> = {}): ReferenceLabel => {
    return { id: "user-1", label: "Ivan Horvat", state: "found", ...overrides };
};

export interface RuleReferenceEntries {
    users?: ReferenceLabel[];
    teams?: ReferenceLabel[];
    folders?: ReferenceLabel[];
    // A user's team ids by user id.
    userTeamIds?: Record<string, string[]>;
}

// Builds the maps of `RuleReferences` from lists; nothing given is an empty map.
export const createRuleReferences = (entries: RuleReferenceEntries = {}): RuleReferences => {
    const users = entries.users ?? [];
    const teams = entries.teams ?? [];
    const folders = entries.folders ?? [];
    const userTeamIds = entries.userTeamIds ?? {};

    const userTeamEntries = Object.entries(userTeamIds);

    return {
        users: new Map<string, ReferenceLabel>(users.map(item => [item.id, item])),
        teams: new Map<string, ReferenceLabel>(teams.map(item => [item.id, item])),
        folders: new Map<string, ReferenceLabel>(folders.map(item => [item.id, item])),
        userTeamIds: new Map<string, string[]>(userTeamEntries)
    };
};
