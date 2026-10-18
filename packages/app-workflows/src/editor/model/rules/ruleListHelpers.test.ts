import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createRuleValue } from "~/editor/testing/ruleFixtures.js";
import { addRule } from "./addRule.js";
import { clearFolderCondition } from "./clearFolderCondition.js";
import { moveRule } from "./moveRule.js";
import { removeRule } from "./removeRule.js";
import { updateRule } from "./updateRule.js";

const A = createRuleValue({ id: "a" });
const B = createRuleValue({ id: "b" });
const C = createRuleValue({ id: "c" });

describe("addRule", () => {
    it("appends the rule and does not mutate the list", () => {
        const rules = [A, B];

        const next = addRule(rules, C);

        expect(next.map(rule => rule.id)).toEqual(["a", "b", "c"]);
        expect(rules.map(rule => rule.id)).toEqual(["a", "b"]);
    });
});

describe("moveRule", () => {
    it("moves a rule up and down and keeps every id", () => {
        const rules = [A, B, C];

        const up = moveRule(rules, 2, 1);
        const down = moveRule(rules, 0, 1);
        const toEnd = moveRule(rules, 0, 2);

        expect(up.map(rule => rule.id)).toEqual(["a", "c", "b"]);
        expect(down.map(rule => rule.id)).toEqual(["b", "a", "c"]);
        expect(toEnd.map(rule => rule.id)).toEqual(["b", "c", "a"]);
    });

    it("keeps the rules themselves unchanged (ids stable across a move)", () => {
        const moved = moveRule([A, B, C], 1, 0);

        expect(moved[0]).toBe(B);
        expect(moved[1]).toBe(A);
        expect(moved[2]).toBe(C);
    });

    it("is a no-op at the bounds and for the same index", () => {
        const rules = [A, B, C];

        const beforeFirst = moveRule(rules, 0, -1);
        const afterLast = moveRule(rules, 2, 3);
        const fromBefore = moveRule(rules, -1, 0);
        const fromAfter = moveRule(rules, 3, 0);
        const sameIndex = moveRule(rules, 1, 1);

        expect(beforeFirst).toBe(rules);
        expect(afterLast).toBe(rules);
        expect(fromBefore).toBe(rules);
        expect(fromAfter).toBe(rules);
        expect(sameIndex).toBe(rules);
    });

    it("does not mutate the list it moves in", () => {
        const rules = [A, B, C];

        moveRule(rules, 0, 2);

        expect(rules.map(rule => rule.id)).toEqual(["a", "b", "c"]);
    });
});

describe("removeRule", () => {
    it("removes the rule with that id and keeps the order of the rest", () => {
        const next = removeRule([A, B, C], "b");

        expect(next.map(rule => rule.id)).toEqual(["a", "c"]);
    });

    it("changes nothing for an unknown id", () => {
        const next = removeRule([A, B], "gone");

        expect(next.map(rule => rule.id)).toEqual(["a", "b"]);
    });
});

describe("updateRule", () => {
    it("merges one field and keeps the id, the other fields and preserved", () => {
        const rule = createRuleValue({
            id: "a",
            requesterTeamId: "team-2",
            preserved: { conditions: { modelId: "article" }, futureRuleKey: 1 }
        });

        const next = updateRule([rule, B], "a", { requesterUserId: "user-1" });

        expect(next[0]).toEqual({ ...rule, requesterUserId: "user-1" });
        expect(next[1]).toBe(B);
    });

    it("sets and clears a requester team and a folder", () => {
        const folder = { id: "folder-1", type: "cms:article", includeDescendants: true };
        const rule = createRuleValue({ id: "a" });

        const set = updateRule([rule], "a", { requesterTeamId: "team-2", folder });
        const cleared = updateRule(set, "a", { requesterTeamId: null, folder: null });

        expect(set[0].requesterTeamId).toBe("team-2");
        expect(set[0].folder).toEqual(folder);
        expect(cleared[0].requesterTeamId).toBeNull();
        expect(cleared[0].folder).toBeNull();
    });

    it("ignores a key the patch leaves undefined", () => {
        const rule = createRuleValue({ id: "a", requesterUserId: "user-1" });

        const next = updateRule([rule], "a", { requesterUserId: undefined });

        expect(next[0].requesterUserId).toBe("user-1");
    });

    it("drops a preserved target of an unknown type when a target is chosen or cleared", () => {
        const rule = createRuleValue({
            id: "a",
            target: null,
            preserved: { target: { type: "role", id: "role-1" }, futureRuleKey: 1 }
        });

        const chosen = updateRule([rule], "a", { target: { type: "user", id: "user-1" } });
        const cleared = updateRule([rule], "a", { target: null });

        expect(chosen[0].target).toEqual({ type: "user", id: "user-1" });
        expect(chosen[0].preserved).toEqual({ futureRuleKey: 1 });
        expect(cleared[0].preserved).toEqual({ futureRuleKey: 1 });
    });

    it("keeps preserved when the patch does not touch the target", () => {
        const rule = createRuleValue({
            id: "a",
            target: null,
            preserved: { target: { type: "role", id: "role-1" } }
        });

        const next = updateRule([rule], "a", { requesterUserId: "user-1" });

        expect(next[0].preserved).toEqual({ target: { type: "role", id: "role-1" } });
    });

    it("changes nothing for an unknown id and does not mutate its input", () => {
        const rules = [A, B];

        const next = updateRule(rules, "gone", { requesterUserId: "user-1" });

        expect(next).toEqual(rules);
        expect(rules[0].requesterUserId).toBeNull();
    });
});

describe("clearFolderCondition", () => {
    it("clears the folder and its subfolders flag and keeps the rest of the rule", () => {
        const rule = createRuleValue({
            id: "a",
            requesterUserId: "user-1",
            requesterTeamId: "team-2",
            folder: { id: "folder-9", type: "cms:article", includeDescendants: true },
            target: { type: "user", id: "user-3" },
            preserved: { conditions: { modelId: "article" } }
        });

        const next = clearFolderCondition(rule);

        expect(next).toEqual({ ...rule, folder: null });
        expect(rule.folder).not.toBeNull();
    });
});
