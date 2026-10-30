import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { hasPreservedConditions } from "./hasPreservedConditions.js";
import { readAssignment } from "./readAssignment.js";
import { createRuleValue } from "~/editor/testing/ruleFixtures.js";

const STORED = {
    strategy: "roundRobin",
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
                folder: { id: "folder-9", type: "cms:other", includeDescendants: false }
            },
            target: { type: "team", id: "team-1" }
        }
    ]
};

describe("readAssignment: a step without an assignment", () => {
    it("reads null as the review defaults", () => {
        expect(readAssignment(null)).toEqual({
            strategy: "none",
            allowManualPick: false,
            rules: [],
            preserved: {}
        });
    });
});

describe("readAssignment: the typed value", () => {
    it("reads the strategy, the pick toggle and every editable condition", () => {
        const value = readAssignment(STORED);

        expect(value.strategy).toBe("roundRobin");
        expect(value.allowManualPick).toBe(true);
        expect(value.rules[0]).toEqual({
            id: "r1",
            requesterUserId: "user-1",
            requesterTeamId: "team-2",
            folder: { id: "folder-1", type: "cms:article", includeDescendants: true },
            target: { type: "user", id: "user-3" },
            preserved: {
                conditions: { modelId: "article", futureCondition: "x" },
                futureRuleKey: true
            }
        });
    });

    it("keeps a foreign folder type as stored", () => {
        const value = readAssignment(STORED);

        expect(value.rules[1].folder).toEqual({
            id: "folder-9",
            type: "cms:other",
            includeDescendants: false
        });
        expect(value.rules[1].requesterUserId).toBeNull();
        expect(value.rules[1].requesterTeamId).toBeNull();
    });

    it("keeps an unknown assignment key under preserved", () => {
        expect(readAssignment(STORED).preserved).toEqual({
            futureAssignmentKey: { nested: [1, 2] }
        });
    });

    it("reads a rule without conditions and without preserved keys cleanly", () => {
        const value = readAssignment({
            strategy: "none",
            allowManualPick: false,
            rules: [{ id: "r1", conditions: {}, target: { type: "team", id: "team-1" } }]
        });

        expect(value.rules[0]).toEqual(createRuleValue({ id: "r1" }));
    });

    it("reads a non-boolean pick toggle as false", () => {
        const value = readAssignment({ strategy: "none", allowManualPick: "yes", rules: [] });

        expect(value.allowManualPick).toBe(false);
    });

    it("treats rules that are not a list as no rules and drops entries that are not objects", () => {
        const notAList = readAssignment({ strategy: "none", allowManualPick: false, rules: "x" });

        expect(notAList.rules).toEqual([]);

        const value = readAssignment({
            strategy: "none",
            allowManualPick: false,
            rules: [null, 3, { id: "r1", conditions: {}, target: { type: "team", id: "team-1" } }]
        });

        expect(value.rules.map(rule => rule.id)).toEqual(["r1"]);
    });
});

describe("readAssignment: odd saved data (R314)", () => {
    it("reads an unknown strategy as no strategy and keeps the raw value", () => {
        const value = readAssignment({ strategy: "weighted", allowManualPick: false, rules: [] });

        expect(value.strategy).toBeNull();
        expect(value.preserved).toEqual({ strategy: "weighted" });
    });

    it("reads a missing strategy as no strategy with nothing preserved", () => {
        const value = readAssignment({ allowManualPick: false, rules: [] });

        expect(value.strategy).toBeNull();
        expect(value.preserved).toEqual({});
    });

    it("reads a target of an unknown type as no target and keeps it raw", () => {
        const value = readAssignment({
            strategy: "none",
            allowManualPick: false,
            rules: [{ id: "r1", conditions: {}, target: { type: "role", id: "role-1" } }]
        });

        expect(value.rules[0].target).toBeNull();
        expect(value.rules[0].preserved).toEqual({ target: { type: "role", id: "role-1" } });
    });

    it("reads a rule without a target as no target and nothing preserved", () => {
        const value = readAssignment({
            strategy: "none",
            allowManualPick: false,
            rules: [{ id: "r1", conditions: {} }]
        });

        expect(value.rules[0].target).toBeNull();
        expect(value.rules[0].preserved).toEqual({});
    });

    it("keeps a malformed requester user and a malformed folder raw under the conditions", () => {
        const value = readAssignment({
            strategy: "none",
            allowManualPick: false,
            rules: [
                {
                    id: "r1",
                    conditions: { requesterUserId: 5, folder: { id: "folder-1" } },
                    target: { type: "team", id: "team-1" }
                }
            ]
        });

        expect(value.rules[0].requesterUserId).toBeNull();
        expect(value.rules[0].folder).toBeNull();
        expect(value.rules[0].preserved).toEqual({
            conditions: { requesterUserId: 5, folder: { id: "folder-1" } }
        });
    });

    it("gives a rule without an id and every duplicate id a new unique id, and keeps the first of a duplicate", () => {
        const target = { type: "team", id: "team-1" };
        const value = readAssignment({
            strategy: "none",
            allowManualPick: false,
            rules: [
                { conditions: {}, target },
                { id: "dup", conditions: {}, target },
                { id: "dup", conditions: {}, target },
                { id: "", conditions: {}, target }
            ]
        });

        const ids = value.rules.map(rule => rule.id);

        expect(ids[1]).toBe("dup");
        expect(ids[0]).toMatch(/^r[a-z0-9]{12}$/);
        expect(ids[2]).toMatch(/^r[a-z0-9]{12}$/);
        expect(ids[3]).toMatch(/^r[a-z0-9]{12}$/);
        expect(new Set(ids).size).toBe(4);
    });

    it("does not reuse a stored id that appears later in the list for a generated one", () => {
        const target = { type: "team", id: "team-1" };
        const value = readAssignment({
            strategy: "none",
            allowManualPick: false,
            rules: [
                { conditions: {}, target },
                { id: "kept", conditions: {}, target }
            ]
        });

        expect(value.rules[0].id).not.toBe("kept");
        expect(value.rules[1].id).toBe("kept");
    });
});

describe("hasPreservedConditions (R313)", () => {
    it("is true when a condition the editor cannot show is preserved", () => {
        const rule = createRuleValue({ preserved: { conditions: { modelId: "article" } } });

        expect(hasPreservedConditions(rule)).toBe(true);
    });

    it("is true when the stored conditions were not an object", () => {
        const read = readAssignment({
            rules: [{ id: "r1", conditions: "everyone", target: { type: "team", id: "t" } }]
        });

        expect(hasPreservedConditions(read.rules[0])).toBe(true);
    });

    it("is false for no preserved keys, for preserved rule keys only and for an empty conditions record", () => {
        const plain = createRuleValue();
        const ruleKeysOnly = createRuleValue({ preserved: { futureRuleKey: 1 } });
        const emptyConditions = createRuleValue({ preserved: { conditions: {} } });

        expect(hasPreservedConditions(plain)).toBe(false);
        expect(hasPreservedConditions(ruleKeysOnly)).toBe(false);
        expect(hasPreservedConditions(emptyConditions)).toBe(false);
    });
});
