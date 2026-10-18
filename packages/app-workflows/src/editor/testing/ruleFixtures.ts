import type { AssignmentValue } from "~/editor/model/assignment/AssignmentValue.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";

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
