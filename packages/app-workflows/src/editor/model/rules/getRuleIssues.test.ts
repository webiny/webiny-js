import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { createRuleReferences } from "~/editor/testing/ruleFixtures.js";
import { createRuleValue } from "~/editor/testing/ruleFixtures.js";
import type { RuleIssueContext } from "./RuleIssueContext.js";
import { getRuleIssues } from "./getRuleIssues.js";

const context = (overrides: Partial<RuleIssueContext> = {}): RuleIssueContext => {
    return {
        stepTeamIds: ["team-1"],
        references: createRuleReferences({
            users: [
                createReferenceLabel({ id: "user-in", label: "Ivan Horvat" }),
                createReferenceLabel({ id: "user-out", label: "Maja Kos" }),
                createReferenceLabel({ id: "user-gone", label: "Deleted user", state: "deleted" })
            ],
            teams: [
                createReferenceLabel({ id: "team-1", label: "Editors" }),
                createReferenceLabel({ id: "team-2", label: "Marketing" }),
                createReferenceLabel({ id: "team-gone", label: "Deleted team", state: "deleted" })
            ],
            folders: [
                createReferenceLabel({ id: "f1", label: "/Campaigns" }),
                createReferenceLabel({ id: "f9", label: "Restricted folder", state: "restricted" }),
                createReferenceLabel({ id: "fx", label: "Deleted folder", state: "deleted" })
            ],
            userTeamIds: { "user-in": ["team-1", "team-7"], "user-out": ["team-7"] }
        }),
        ...overrides
    };
};

describe("getRuleIssues: errors (R299, Q53)", () => {
    it("is an error when a rule has no target", () => {
        const issues = getRuleIssues([createRuleValue({ id: "a", target: null })], context());

        expect(issues).toEqual([
            {
                ruleId: "a",
                index: 0,
                kind: "error",
                field: "target",
                message: "Choose who this rule assigns to."
            }
        ]);
    });

    it("is an error when a user target is not in the reviewing teams and names the user", () => {
        const rule = createRuleValue({ id: "a", target: { type: "user", id: "user-out" } });

        expect(getRuleIssues([rule], context())).toEqual([
            {
                ruleId: "a",
                index: 0,
                kind: "error",
                field: "target",
                message: "Maja Kos is no longer in the reviewing teams."
            }
        ]);
    });

    it("is clean for a user target in one of the reviewing teams", () => {
        const rule = createRuleValue({ target: { type: "user", id: "user-in" } });

        expect(getRuleIssues([rule], context())).toEqual([]);
    });

    it("is an error when a user target was deleted", () => {
        const rule = createRuleValue({ id: "a", target: { type: "user", id: "user-gone" } });

        expect(getRuleIssues([rule], context())).toEqual([
            {
                ruleId: "a",
                index: 0,
                kind: "error",
                field: "target",
                message: "The assigned user was deleted."
            }
        ]);
    });

    it("is an error when a team target is not a reviewing team and names the team", () => {
        const rule = createRuleValue({ id: "a", target: { type: "team", id: "team-2" } });

        expect(getRuleIssues([rule], context())).toEqual([
            {
                ruleId: "a",
                index: 0,
                kind: "error",
                field: "target",
                message: "Marketing is not a reviewing team."
            }
        ]);
    });

    it("is clean for the pool of a reviewing team", () => {
        const rule = createRuleValue({ target: { type: "team", id: "team-1" } });

        expect(getRuleIssues([rule], context())).toEqual([]);
    });

    it("is an error when a team target was deleted and reports only the deleted message", () => {
        const rule = createRuleValue({ id: "a", target: { type: "team", id: "team-gone" } });

        expect(getRuleIssues([rule], context())).toEqual([
            {
                ruleId: "a",
                index: 0,
                kind: "error",
                field: "target",
                message: "The team was deleted."
            }
        ]);
    });

    it("flags a user target again once the step's teams change", () => {
        const rule = createRuleValue({ target: { type: "user", id: "user-in" } });

        expect(getRuleIssues([rule], context({ stepTeamIds: ["team-9"] }))).toHaveLength(1);
        expect(getRuleIssues([rule], context({ stepTeamIds: ["team-7"] }))).toEqual([]);
    });
});

describe("getRuleIssues: not flagged while unknown (R299)", () => {
    it("does not flag a user whose teams are unknown", () => {
        const references = createRuleReferences({
            users: [createReferenceLabel({ id: "user-x", label: "Luka Perić" })]
        });
        const rule = createRuleValue({ target: { type: "user", id: "user-x" } });

        expect(getRuleIssues([rule], context({ references }))).toEqual([]);
    });

    it("does not flag a target that is not resolved yet", () => {
        const references = createRuleReferences();
        const user = createRuleValue({ target: { type: "user", id: "user-x" } });
        const team = createRuleValue({ target: { type: "team", id: "team-x" } });

        expect(getRuleIssues([user, team], context({ references }))).toEqual([]);
    });
});

describe("getRuleIssues: warnings (R299)", () => {
    it("warns about a deleted folder and does not block", () => {
        const rule = createRuleValue({
            id: "a",
            folder: { id: "fx", type: "cms:article", includeDescendants: false }
        });

        expect(getRuleIssues([rule], context())).toEqual([
            {
                ruleId: "a",
                index: 0,
                kind: "warning",
                field: "folder",
                message: "The folder no longer exists."
            }
        ]);
    });

    it("warns about a deleted requester team", () => {
        const rule = createRuleValue({ id: "a", requesterTeamId: "team-gone" });

        expect(getRuleIssues([rule], context())).toEqual([
            {
                ruleId: "a",
                index: 0,
                kind: "warning",
                field: "requesterTeam",
                message: "The team was deleted."
            }
        ]);
    });

    it("has no warning for a restricted folder", () => {
        const rule = createRuleValue({
            folder: { id: "f9", type: "cms:article", includeDescendants: true }
        });

        expect(getRuleIssues([rule], context())).toEqual([]);
    });

    it("has no issue for a deleted requester user", () => {
        const rule = createRuleValue({ requesterUserId: "user-gone" });

        expect(getRuleIssues([rule], context())).toEqual([]);
    });

    it("has no issue for a found folder and a found requester team", () => {
        const rule = createRuleValue({
            requesterTeamId: "team-2",
            folder: { id: "f1", type: "cms:article", includeDescendants: true }
        });

        expect(getRuleIssues([rule], context())).toEqual([]);
    });
});

describe("getRuleIssues: several rules", () => {
    it("lists the issues in rule order with the rule's index and a target error before a warning of the same rule", () => {
        const rules = [
            createRuleValue({ id: "a" }),
            createRuleValue({
                id: "b",
                target: null,
                folder: { id: "fx", type: "cms:article", includeDescendants: false }
            }),
            createRuleValue({ id: "c", target: { type: "user", id: "user-out" } })
        ];

        const issues = getRuleIssues(rules, context());

        expect(issues.map(issue => [issue.ruleId, issue.index, issue.kind, issue.field])).toEqual([
            ["b", 1, "error", "target"],
            ["b", 1, "warning", "folder"],
            ["c", 2, "error", "target"]
        ]);
    });

    it("is empty for no rules", () => {
        expect(getRuleIssues([], context())).toEqual([]);
    });
});
