import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAssignmentValue } from "~/editor/testing/ruleFixtures.js";
import { createRuleValue } from "~/editor/testing/ruleFixtures.js";
import { assignmentToConfig } from "./assignmentToConfig.js";
import { readAssignment } from "./readAssignment.js";

const FULL = {
    strategy: "leastLoaded",
    allowManualPick: true,
    futureAssignmentKey: { nested: [1, 2] },
    rules: [
        {
            id: "r1",
            conditions: {
                requesterUserId: "user-1",
                requesterTeamId: "team-2",
                folder: { id: "folder-1", type: "cms:article", includeDescendants: true },
                modelId: "article",
                futureCondition: "x"
            },
            target: { type: "user", id: "user-3" },
            futureRuleKey: true
        },
        {
            id: "r2",
            conditions: {
                folder: { id: "folder-9", type: "wb:page", includeDescendants: false }
            },
            target: { type: "team", id: "team-1" }
        },
        { id: "r3", conditions: {}, target: { type: "team", id: "team-2" } }
    ]
};

describe("assignmentToConfig: the client round trip (Review Focus 2)", () => {
    it("writes a stored config with modelId, a foreign folder type, unknown rule, condition and assignment keys back unchanged", () => {
        const value = readAssignment(FULL);
        const written = assignmentToConfig(value);
        const serialised = JSON.stringify(written);
        const parsed = JSON.parse(serialised);

        expect(written).toEqual(FULL);
        expect(parsed).toEqual(FULL);
    });

    it("never emits null for an absent condition and always emits the conditions object", () => {
        const value = readAssignment(FULL);
        const written = assignmentToConfig(value);
        const rules = written.rules as Record<string, unknown>[];

        expect(rules[2].conditions).toEqual({});
        expect(Object.keys(rules[1].conditions as Record<string, unknown>)).toEqual(["folder"]);
    });

    it("keeps an unknown strategy until the admin picks one", () => {
        const stored = { strategy: "weighted", allowManualPick: false, rules: [] };
        const value = readAssignment(stored);

        const picked = assignmentToConfig({ ...value, strategy: "roundRobin" });

        expect(assignmentToConfig(value)).toEqual(stored);
        expect(picked).toEqual({
            strategy: "roundRobin",
            allowManualPick: false,
            rules: []
        });
    });

    it("writes a missing strategy back as missing", () => {
        const stored = { allowManualPick: false, rules: [] };
        const value = readAssignment(stored);

        expect(assignmentToConfig(value)).toEqual(stored);
    });

    it("keeps a target of an unknown type until the admin picks one", () => {
        const stored = {
            strategy: "none",
            allowManualPick: false,
            rules: [{ id: "r1", conditions: {}, target: { type: "role", id: "role-1" } }]
        };
        const value = readAssignment(stored);

        expect(assignmentToConfig(value)).toEqual(stored);

        const picked = {
            ...value,
            rules: [{ ...value.rules[0], target: { type: "team" as const, id: "team-1" } }]
        };
        const written = assignmentToConfig(picked);
        const rules = written.rules as Record<string, unknown>[];

        expect(rules[0].target).toEqual({ type: "team", id: "team-1" });
    });

    it("writes a malformed condition back unchanged and lets a picked value replace it", () => {
        const stored = {
            strategy: "none",
            allowManualPick: false,
            rules: [
                {
                    id: "r1",
                    conditions: { requesterUserId: 5 },
                    target: { type: "team", id: "team-1" }
                }
            ]
        };
        const value = readAssignment(stored);

        expect(assignmentToConfig(value)).toEqual(stored);

        const picked = { ...value, rules: [{ ...value.rules[0], requesterUserId: "user-1" }] };
        const rules = assignmentToConfig(picked).rules as Record<string, unknown>[];

        expect(rules[0].conditions).toEqual({ requesterUserId: "user-1" });
    });

    it("keeps the conditions the editor does not show when an editable one changes", () => {
        const value = readAssignment(FULL);
        const edited = {
            ...value,
            rules: [
                { ...value.rules[0], requesterTeamId: null, folder: null },
                ...value.rules.slice(1)
            ]
        };
        const rules = assignmentToConfig(edited).rules as Record<string, unknown>[];

        expect(rules[0].conditions).toEqual({
            requesterUserId: "user-1",
            modelId: "article",
            futureCondition: "x"
        });
        expect(rules[0].futureRuleKey).toBe(true);
    });

    it("keeps ids stable and the order of the rules", () => {
        const value = readAssignment(FULL);
        const reversed = { ...value, rules: [...value.rules].reverse() };
        const rules = assignmentToConfig(reversed).rules as Record<string, unknown>[];

        expect(rules.map(rule => rule.id)).toEqual(["r3", "r2", "r1"]);
    });
});

describe("assignmentToConfig: values built by the editor", () => {
    it("writes the default assignment as the review defaults", () => {
        const value = createAssignmentValue();

        expect(assignmentToConfig(value)).toEqual({
            strategy: "none",
            allowManualPick: false,
            rules: []
        });
    });

    it("writes a new rule with a team target and no condition keys", () => {
        const value = createAssignmentValue({
            rules: [createRuleValue({ id: "r9", target: { type: "team", id: "team-1" } })]
        });

        expect(assignmentToConfig(value).rules).toEqual([
            { id: "r9", conditions: {}, target: { type: "team", id: "team-1" } }
        ]);
    });

    it("omits the target of a rule that has none and nothing preserved", () => {
        const value = createAssignmentValue({
            rules: [createRuleValue({ id: "r9", target: null })]
        });

        expect(assignmentToConfig(value).rules).toEqual([{ id: "r9", conditions: {} }]);
    });

    it("does not mutate the value it writes", () => {
        const value = readAssignment(FULL);
        const before = JSON.stringify(value);

        assignmentToConfig(value);

        expect(JSON.stringify(value)).toBe(before);
    });
});
