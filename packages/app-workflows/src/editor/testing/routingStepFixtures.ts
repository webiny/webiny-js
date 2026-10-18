import type { EditorStep } from "~/editor/domain/types.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";

export interface StoredFolder {
    id: string;
    type: string;
    includeDescendants: boolean;
}

export interface StoredTarget {
    type: string;
    id: string;
}

export interface StoredRuleOptions {
    id: string;
    requesterUserId?: string;
    requesterTeamId?: string;
    folder?: StoredFolder;
    // `null` leaves the rule without a target; the default is the team `team-1`.
    target?: StoredTarget | null;
}

// A rule exactly as the server stores it: `{ id, conditions, target }`.
export const createStoredRule = (options: StoredRuleOptions): Record<string, unknown> => {
    const conditions: Record<string, unknown> = {};
    if (options.requesterUserId !== undefined) {
        conditions.requesterUserId = options.requesterUserId;
    }
    if (options.requesterTeamId !== undefined) {
        conditions.requesterTeamId = options.requesterTeamId;
    }
    if (options.folder !== undefined) {
        conditions.folder = options.folder;
    }

    const rule: Record<string, unknown> = { id: options.id, conditions };
    if (options.target === undefined) {
        rule.target = { type: "team", id: "team-1" };
    }
    if (options.target !== undefined && options.target !== null) {
        rule.target = options.target;
    }
    return rule;
};

// A People step (`step-1` unless named) with the strategy `none`, the toggle off and these rules.
export const createRoutingStep = (
    rules: Record<string, unknown>[],
    teams: string[] = ["team-1"],
    id = "step-1"
): EditorStep => {
    return createReviewStep({
        id,
        config: {
            teams,
            assignment: { strategy: "none", allowManualPick: false, rules }
        }
    });
};

export const createListedUser = (
    id: string,
    displayName: string,
    teamIds: string[] = ["team-1"]
): WorkflowUserSummary => {
    return { id, displayName, teamIds };
};
