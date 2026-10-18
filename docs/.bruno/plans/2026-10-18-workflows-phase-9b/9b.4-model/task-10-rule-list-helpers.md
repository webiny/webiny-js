### Task 10: Rule list helpers

R294, R295, R296, R313; Review Focus 2. Pure helpers over `RuleValue[]` that the rule list renderer (Task 21b) and the rule card (Task 21) call. They return new arrays and objects, never mutate, and never touch a rule's id except to create one.

- **`createRule(teamIds, existingIds)`** (R296): a new rule has no conditions and the target `{ type: "team", id: <first reviewing team> }`, or no target when the step has no teams (a client error until chosen, R299). Its id comes from `createRuleId(existingIds)` (Task 9).
- **`addRule(rules, rule)`** appends.
- **`moveRule(rules, from, to)`** moves one rule. An index outside the list, or `from === to`, is a no-op that returns the same array. Ids are untouched.
- **`removeRule(rules, ruleId)`** drops the rule with that id; an unknown id changes nothing.
- **`updateRule(rules, ruleId, patch)`** merges the keys of `RulePatch` that are not `undefined` into the matching rule and keeps `id` and `preserved`. Setting `target` (a value or `null`) drops `preserved.target`: a stored target of an unknown type is replaced the moment the admin chooses one, and a cleared target must not bring the old raw one back. An unknown id changes nothing.
- **`clearFolderCondition(rule)`** (the restricted folder's `Remove`, QBZ-15): clears the folder, which holds `includeDescendants`, and keeps every other part of the rule.

**Files:**
- Create: `packages/app-workflows/src/editor/model/rules/RulePatch.ts`
- Create: `packages/app-workflows/src/editor/model/rules/createRule.ts`
- Create: `packages/app-workflows/src/editor/model/rules/addRule.ts`
- Create: `packages/app-workflows/src/editor/model/rules/moveRule.ts`
- Create: `packages/app-workflows/src/editor/model/rules/removeRule.ts`
- Create: `packages/app-workflows/src/editor/model/rules/updateRule.ts`
- Create: `packages/app-workflows/src/editor/model/rules/clearFolderCondition.ts`
- Create: `packages/app-workflows/src/editor/model/rules/createRule.test.ts`
- Create: `packages/app-workflows/src/editor/model/rules/ruleListHelpers.test.ts`

**Interfaces:**
- Consumes: Task 9 (`RuleValue`, `RuleFolderValue`, `RuleTargetValue`, `createRuleId`, `createRuleValue`).
- Produces: `RulePatch { requesterUserId?: string | null; requesterTeamId?: string | null; folder?: RuleFolderValue | null; target?: RuleTargetValue | null }`, `createRule(teamIds: string[], existingIds: string[]): RuleValue`, `addRule(rules: RuleValue[], rule: RuleValue): RuleValue[]`, `moveRule(rules: RuleValue[], from: number, to: number): RuleValue[]`, `removeRule(rules: RuleValue[], ruleId: string): RuleValue[]`, `updateRule(rules: RuleValue[], ruleId: string, patch: RulePatch): RuleValue[]`, `clearFolderCondition(rule: RuleValue): RuleValue`.

**Test runner note:** admin package, `yarn test <path>` only. Plain `.ts` tests.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/model/rules/createRule.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createRule } from "./createRule.js";

describe("createRule (R296)", () => {
    it("targets the pool of the first reviewing team and has no condition", () => {
        const rule = createRule(["team-2", "team-1"], []);

        expect(rule).toEqual({
            id: rule.id,
            requesterUserId: null,
            requesterTeamId: null,
            folder: null,
            target: { type: "team", id: "team-2" },
            preserved: {}
        });
    });

    it("has no target when the step has no teams", () => {
        const rule = createRule([], []);

        expect(rule.target).toBeNull();
    });

    it("creates an id that is not among the existing ones", () => {
        const first = createRule(["team-1"], []);
        const second = createRule(["team-1"], [first.id]);

        expect(first.id).toMatch(/^r[a-z0-9]{12}$/);
        expect(second.id).not.toBe(first.id);
    });
});
```

Create `packages/app-workflows/src/editor/model/rules/ruleListHelpers.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/model/rules/createRule.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/rules/ruleListHelpers.test.ts 2>&1 | tail -30
```

Expected: both fail with `Failed to resolve import` for `./createRule.js`, `./addRule.js`, `./clearFolderCondition.js`, `./moveRule.js`, `./removeRule.js` and `./updateRule.js`. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/model/rules/RulePatch.ts`:

```ts
import type { RuleFolderValue } from "~/editor/model/assignment/RuleFolderValue.js";
import type { RuleTargetValue } from "~/editor/model/assignment/RuleTargetValue.js";

/*
 * The keys of a rule the editor edits. A key that is `undefined` leaves the rule's value alone;
 * `null` clears it. The id and the preserved data are never patched.
 */
export interface RulePatch {
    requesterUserId?: string | null;
    requesterTeamId?: string | null;
    folder?: RuleFolderValue | null;
    target?: RuleTargetValue | null;
}
```

Create `packages/app-workflows/src/editor/model/rules/createRule.ts`:

```ts
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import { createRuleId } from "~/editor/model/createRuleId.js";

/*
 * A new rule (R296): no conditions and the pool of the first reviewing team as its target, or no
 * target when the step has no teams. The design preselects a member of that team; that needs a
 * member lookup before the card appears, so the pool is the default (one pick from a person).
 */
export const createRule = (teamIds: string[], existingIds: string[]): RuleValue => {
    const id = createRuleId(existingIds);
    const firstTeamId = teamIds[0];

    return {
        id,
        requesterUserId: null,
        requesterTeamId: null,
        folder: null,
        target: firstTeamId === undefined ? null : { type: "team", id: firstTeamId },
        preserved: {}
    };
};
```

Create `packages/app-workflows/src/editor/model/rules/addRule.ts`:

```ts
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";

export const addRule = (rules: RuleValue[], rule: RuleValue): RuleValue[] => {
    return [...rules, rule];
};
```

Create `packages/app-workflows/src/editor/model/rules/moveRule.ts`:

```ts
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";

/*
 * Moves the rule at `from` to position `to`. An index outside the list, or the same index, returns
 * the same array (the buttons at the first and last card are disabled, so this is a safety net).
 * The rules themselves are not copied, so their ids stay.
 */
export const moveRule = (rules: RuleValue[], from: number, to: number): RuleValue[] => {
    const last = rules.length - 1;
    if (from === to || from < 0 || to < 0 || from > last || to > last) {
        return rules;
    }

    const next = [...rules];
    const moved = next.splice(from, 1);
    next.splice(to, 0, ...moved);
    return next;
};
```

Create `packages/app-workflows/src/editor/model/rules/removeRule.ts`:

```ts
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";

export const removeRule = (rules: RuleValue[], ruleId: string): RuleValue[] => {
    return rules.filter(rule => rule.id !== ruleId);
};
```

Create `packages/app-workflows/src/editor/model/rules/updateRule.ts`:

```ts
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
```

Create `packages/app-workflows/src/editor/model/rules/clearFolderCondition.ts`:

```ts
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";

/*
 * The restricted folder's `Remove` (QBZ-15): the folder condition goes, and with it the subfolders
 * flag, which the folder value holds. The rest of the rule stays.
 */
export const clearFolderCondition = (rule: RuleValue): RuleValue => {
    return { ...rule, folder: null };
};
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/model/rules/createRule.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/rules/ruleListHelpers.test.ts 2>&1 | tail -30
```

Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/editor/model 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors.

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-workflows): add the routing rule list helpers" -m "createRule, addRule, moveRule, removeRule, updateRule and clearFolderCondition work on plain rule values: a new rule targets the first reviewing team's pool, moves keep rule ids and bounds are no-ops, an update merges one field and keeps the preserved data, clearing the folder condition keeps the rest of the rule." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`createRule` no-team default:** `teamIds[0]` is `undefined` for an empty list; the file reads it into `firstTeamId` and branches with a one-line ternary (the repository has `noUncheckedIndexedAccess` off, so the type of `teamIds[0]` is `string`; the runtime check is what matters).
- **`RulePatch` lives in its own file** `rules/RulePatch.ts` (named interface, no inline type), as the contract asks for "a named interface of the editable keys".
- **Contract list names `RulePatch` only as a produced type;** the file name is this task's choice.

## Review fixes (sub-phase review)

- Removed `yarn check:test:types -p app-workflows` from Step 5 (the package has no `__tests__` folder, 8a R243; the build type-checks the co-located tests).
- Named the nested call arguments in the `createRule`, `moveRule` and `removeRule` tests (no-nested-call-arguments rule).
- Checked: `createRule` preselects `team:<first team>` as the controller ruling on R296 says; `createRuleId(existing)` matches the consistency item.
