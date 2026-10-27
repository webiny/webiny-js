### Task 9: Typed assignment, rule ids, preservation

R293, R294, R295, R297, R314; D42, D69; Review Focus 2. The editor reads the stored `assignment` object into a typed `AssignmentValue` and writes it back without losing anything it does not edit. Nothing here touches a presenter, a form or the server.

- **Types (one per file, `[AWE]/model/assignment`):** `AssignmentStrategy` (`"none" | "roundRobin" | "leastLoaded"`) with the list `ASSIGNMENT_STRATEGIES`, `RuleTargetValue`, `RuleFolderValue`, `RuleValue` (R295), `AssignmentValue`.
- **`readAssignment(assignment)`** parses the stored record (`readReviewConfig(...).assignment`, `null` for a step without one: the defaults `none`, `false`, no rules). A condition key the editor does not edit (`modelId` and any unknown key) goes to `rule.preserved.conditions`; any other unknown rule key goes to `rule.preserved`; an unknown assignment key goes to `assignment.preserved`. A malformed editable condition (a `requesterUserId` that is not a non-empty string, a `folder` without a string `id`, a string `type` and a boolean `includeDescendants`) is kept raw under `preserved.conditions` and shows as no value, so it is written back unchanged. A foreign folder `type` is a valid folder and stays as stored (R295).
- **Odd saved data (R314):** an unknown `strategy` (any stored value that is not one of the three) reads as `strategy: null` and the raw value waits in `assignment.preserved.strategy` until the admin picks one (no silent rewrite); a target whose `type` is not `user` or `team` (or whose id is empty) reads as `target: null` with the raw target under `rule.preserved.target`; a rule without an `id` and every later duplicate id get a new id at load (the one exception to R294); a non-boolean `allowManualPick` reads as `false`; entries of `rules` that are not objects are dropped.
- **`assignmentToConfig(value)`** is the inverse: the preserved keys first, then the known keys on top (a known value always wins over a preserved one: picking a target replaces `preserved.target`, picking a strategy replaces `preserved.strategy`). Absent optional conditions are omitted, never `null`; `conditions` is always emitted (the server requires the object, `{}` for none); `target` is omitted only when there is none and nothing preserved. Key order is not part of the contract; tests compare with `toEqual`.
- **`createRuleId(existing)`** is the only id generator: `r` followed by 12 random lowercase alphanumeric characters, retried until it is not in `existing` (R294). The contract's entry takes the list of ids to avoid; R294 writes it without the list (see Contract notes).
- **`hasPreservedConditions(rule)`** answers whether `rule.preserved.conditions` holds a key (R313; Tasks 11 and 21 use it).
- **Fixtures:** `[AWET]/ruleFixtures.ts` gets `createRuleValue` and `createAssignmentValue` (pure builders, no vitest import; Task 11 adds the reference builders to the same file).

**Files:**
- Modify: `packages/app-workflows/src/editor/model/assignment/AssignmentStrategy.ts` (created by Task 7 of 9b.3 with the type only; this task adds `ASSIGNMENT_STRATEGIES`)
- Create: `packages/app-workflows/src/editor/model/assignment/RuleTargetValue.ts`
- Create: `packages/app-workflows/src/editor/model/assignment/RuleFolderValue.ts`
- Create: `packages/app-workflows/src/editor/model/assignment/RuleValue.ts`
- Create: `packages/app-workflows/src/editor/model/assignment/AssignmentValue.ts`
- Create: `packages/app-workflows/src/editor/model/assignment/readAssignment.ts`
- Create: `packages/app-workflows/src/editor/model/assignment/assignmentToConfig.ts`
- Create: `packages/app-workflows/src/editor/model/assignment/hasPreservedConditions.ts`
- Create: `packages/app-workflows/src/editor/model/createRuleId.ts`
- Create: `packages/app-workflows/src/editor/testing/ruleFixtures.ts`
- Create: `packages/app-workflows/src/editor/model/assignment/readAssignment.test.ts`
- Create: `packages/app-workflows/src/editor/model/assignment/assignmentToConfig.test.ts`
- Create: `packages/app-workflows/src/editor/model/createRuleId.test.ts`

`readReviewConfig.ts` and `createDefaultAssignment.ts` stay unchanged (`readReviewConfig(...).assignment` is the stored record that `readAssignment` parses). `WorkflowDraft.toInput` and `toStepInput` stay unchanged: a step's `config` already is the stored shape, `assignmentToConfig` is called only by `getPeopleStepPatch` (Task 18).

**Interfaces:**
- Consumes: `AssignmentStrategy` (`~/editor/model/assignment/AssignmentStrategy.js`, created by Task 7 of 9b.3), `isRecord` (`~/editor/model/isRecord.js`, verified in `packages/app-workflows/src/editor/model/isRecord.ts`).
- Produces: `ASSIGNMENT_STRATEGIES: AssignmentStrategy[]`, `RuleTargetValue { type: "user" | "team"; id: string }`, `RuleFolderValue { id: string; type: string; includeDescendants: boolean }`, `RuleValue { id; requesterUserId: string | null; requesterTeamId: string | null; folder: RuleFolderValue | null; target: RuleTargetValue | null; preserved: Record<string, unknown> }`, `AssignmentValue { strategy: AssignmentStrategy | null; allowManualPick: boolean; rules: RuleValue[]; preserved: Record<string, unknown> }`, `readAssignment(assignment: Record<string, unknown> | null): AssignmentValue`, `assignmentToConfig(value: AssignmentValue): Record<string, unknown>`, `createRuleId(existing: string[]): string`, `hasPreservedConditions(rule: RuleValue): boolean`, `createRuleValue(overrides?: Partial<RuleValue>): RuleValue`, `createAssignmentValue(overrides?: Partial<AssignmentValue>): AssignmentValue`.

**Test runner note:** admin package, `yarn test <path>` only. These are plain `.ts` tests, no React.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/testing/ruleFixtures.ts`:

```ts
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
export const createAssignmentValue = (overrides: Partial<AssignmentValue> = {}): AssignmentValue => {
    return {
        strategy: "none",
        allowManualPick: false,
        rules: [],
        preserved: {},
        ...overrides
    };
};
```

Create `packages/app-workflows/src/editor/model/createRuleId.test.ts`:

```ts
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { createRuleId } from "./createRuleId.js";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("createRuleId (R294)", () => {
    it("is an r followed by 12 lowercase alphanumeric characters", () => {
        for (let index = 0; index < 50; index++) {
            expect(createRuleId([])).toMatch(/^r[a-z0-9]{12}$/);
        }
    });

    it("is unique across a growing list of existing ids", () => {
        const ids: string[] = [];
        for (let index = 0; index < 200; index++) {
            ids.push(createRuleId(ids));
        }

        expect(new Set(ids).size).toBe(200);
    });

    it("retries when the first candidate is already taken", () => {
        const random = vi.spyOn(Math, "random");
        // The first candidate is twelve times the first character (`raaaaaaaaaaaa`), the second twelve times the character at 0.5.
        for (let index = 0; index < 12; index++) {
            random.mockReturnValueOnce(0);
        }
        random.mockReturnValue(0.5);

        const id = createRuleId(["raaaaaaaaaaaa"]);

        expect(id).toBe("rssssssssssss");
    });
});
```

Create `packages/app-workflows/src/editor/model/assignment/readAssignment.test.ts`:

```ts
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

    it("is false for no preserved keys, for preserved rule keys only and for an empty conditions record", () => {
        const plain = createRuleValue();
        const ruleKeysOnly = createRuleValue({ preserved: { futureRuleKey: 1 } });
        const emptyConditions = createRuleValue({ preserved: { conditions: {} } });

        expect(hasPreservedConditions(plain)).toBe(false);
        expect(hasPreservedConditions(ruleKeysOnly)).toBe(false);
        expect(hasPreservedConditions(emptyConditions)).toBe(false);
    });
});
```

Create `packages/app-workflows/src/editor/model/assignment/assignmentToConfig.test.ts`:

```ts
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
        const written = assignmentToConfig(readAssignment(FULL));
        const serialised = JSON.stringify(written);
        const parsed = JSON.parse(serialised);

        expect(written).toEqual(FULL);
        expect(parsed).toEqual(FULL);
    });

    it("never emits null for an absent condition and always emits the conditions object", () => {
        const written = assignmentToConfig(readAssignment(FULL));
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
            rules: [{ ...value.rules[0], requesterTeamId: null, folder: null }, ...value.rules.slice(1)]
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
        expect(assignmentToConfig(createAssignmentValue())).toEqual({
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
        const value = createAssignmentValue({ rules: [createRuleValue({ id: "r9", target: null })] });

        expect(assignmentToConfig(value).rules).toEqual([{ id: "r9", conditions: {} }]);
    });

    it("does not mutate the value it writes", () => {
        const value = readAssignment(FULL);
        const before = JSON.stringify(value);

        assignmentToConfig(value);

        expect(JSON.stringify(value)).toBe(before);
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/model/createRuleId.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/assignment/readAssignment.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/assignment/assignmentToConfig.test.ts 2>&1 | tail -30
```

Expected: each file fails with `Failed to resolve import` for `./createRuleId.js`, `./readAssignment.js`, `./hasPreservedConditions.js`, `./assignmentToConfig.js` or `~/editor/testing/ruleFixtures.js` (the fixtures file exists after Step 1 but imports the not yet created types). Record the RED output.

- [ ] **Step 3: Implement**

Modify `packages/app-workflows/src/editor/model/assignment/AssignmentStrategy.ts`. Task 7 of 9b.3 created it with the type only; do not recreate it. Add the list below the type.

Before (as Task 7 left the file):

```ts
// The stored `assignment.strategy` of a People step (R297); Task 9 reads and writes it.
export type AssignmentStrategy = "none" | "roundRobin" | "leastLoaded";
```

After:

```ts
// The stored `assignment.strategy` of a People step (R297); Task 9 reads and writes it.
export type AssignmentStrategy = "none" | "roundRobin" | "leastLoaded";

// Every strategy the server stores (`reviewStepConfigSchema`), in the order the editor offers them as radio cards.
export const ASSIGNMENT_STRATEGIES: AssignmentStrategy[] = ["none", "roundRobin", "leastLoaded"];
```

Verify first: if Task 7's file text differs, keep its type line and add only the constant.

Create `packages/app-workflows/src/editor/model/assignment/RuleTargetValue.ts`:

```ts
// Who a rule assigns to: a person or a reviewing team's pool.
export interface RuleTargetValue {
    type: "user" | "team";
    id: string;
}
```

Create `packages/app-workflows/src/editor/model/assignment/RuleFolderValue.ts`:

```ts
// A rule's folder condition as stored. `type` is `cms:<modelId>` or `wb:page`; a foreign type stays as stored (R295).
export interface RuleFolderValue {
    id: string;
    type: string;
    includeDescendants: boolean;
}
```

Create `packages/app-workflows/src/editor/model/assignment/RuleValue.ts`:

```ts
import type { RuleFolderValue } from "./RuleFolderValue.js";
import type { RuleTargetValue } from "./RuleTargetValue.js";

/*
 * A routing rule as the editor holds it (R295). Plain JSON: the form value of the rule list is an
 * array of these, so it never holds a class instance or a React node.
 *
 * `preserved` carries what the editor does not edit and writes back unchanged: `conditions` holds
 * the unknown condition keys (`modelId` and any other, plus a malformed editable condition kept
 * raw), `target` holds a target of an unknown type, every other key is an unknown rule key.
 */
export interface RuleValue {
    id: string;
    requesterUserId: string | null;
    requesterTeamId: string | null;
    folder: RuleFolderValue | null;
    target: RuleTargetValue | null;
    preserved: Record<string, unknown>;
}
```

Create `packages/app-workflows/src/editor/model/assignment/AssignmentValue.ts`:

```ts
import type { AssignmentStrategy } from "./AssignmentStrategy.js";
import type { RuleValue } from "./RuleValue.js";

export interface AssignmentValue {
    // `null` when the stored strategy is none of the three (R314): the raw value is in `preserved.strategy` until the admin picks one.
    strategy: AssignmentStrategy | null;
    allowManualPick: boolean;
    rules: RuleValue[];
    // Unknown assignment keys, written back unchanged.
    preserved: Record<string, unknown>;
}
```

Create `packages/app-workflows/src/editor/model/createRuleId.ts`:

```ts
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const SUFFIX_LENGTH = 12;

function createSuffix(): string {
    let suffix = "";
    for (let index = 0; index < SUFFIX_LENGTH; index++) {
        const position = Math.floor(Math.random() * ALPHABET.length);
        suffix += ALPHABET.charAt(position);
    }
    return suffix;
}

/*
 * The only generator of rule ids (R294): `r` and 12 random lowercase alphanumeric characters,
 * retried until the id is not among `existing`. Called when a rule is added, and at load for a
 * stored rule that has no usable id (R314); never on reorder.
 */
export const createRuleId = (existing: string[]): string => {
    let id = `r${createSuffix()}`;
    while (existing.includes(id)) {
        id = `r${createSuffix()}`;
    }
    return id;
};
```

Create `packages/app-workflows/src/editor/model/assignment/hasPreservedConditions.ts`:

```ts
import { isRecord } from "~/editor/model/isRecord.js";
import type { RuleValue } from "./RuleValue.js";

/*
 * True when the rule holds a stored condition the editor cannot show (R313): `modelId`, an unknown
 * key or a malformed editable condition. A summary must not read `Always` for such a rule.
 */
export const hasPreservedConditions = (rule: RuleValue): boolean => {
    const conditions = rule.preserved.conditions;
    return isRecord(conditions) && Object.keys(conditions).length > 0;
};
```

Create `packages/app-workflows/src/editor/model/assignment/readAssignment.ts`:

```ts
import { createRuleId } from "~/editor/model/createRuleId.js";
import { isRecord } from "~/editor/model/isRecord.js";
import { ASSIGNMENT_STRATEGIES } from "./AssignmentStrategy.js";
import type { AssignmentStrategy } from "./AssignmentStrategy.js";
import type { AssignmentValue } from "./AssignmentValue.js";
import type { RuleFolderValue } from "./RuleFolderValue.js";
import type { RuleTargetValue } from "./RuleTargetValue.js";
import type { RuleValue } from "./RuleValue.js";

const KNOWN_ASSIGNMENT_KEYS = ["strategy", "allowManualPick", "rules"];
const KNOWN_RULE_KEYS = ["id", "conditions", "target"];
const KNOWN_CONDITION_KEYS = ["requesterUserId", "requesterTeamId", "folder"];

function isAssignmentStrategy(value: unknown): value is AssignmentStrategy {
    return ASSIGNMENT_STRATEGIES.some(strategy => strategy === value);
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value !== "";
}

function copyUnknownKeys(
    source: Record<string, unknown>,
    knownKeys: string[]
): Record<string, unknown> {
    const copy: Record<string, unknown> = {};
    for (const key of Object.keys(source)) {
        if (!knownKeys.includes(key)) {
            copy[key] = source[key];
        }
    }
    return copy;
}

function readFolder(value: unknown): RuleFolderValue | null {
    if (!isRecord(value)) {
        return null;
    }
    const { id, type, includeDescendants } = value;
    if (!isNonEmptyString(id) || !isNonEmptyString(type)) {
        return null;
    }
    if (typeof includeDescendants !== "boolean") {
        return null;
    }
    return { id, type, includeDescendants };
}

function readTarget(value: unknown): RuleTargetValue | null {
    if (!isRecord(value)) {
        return null;
    }
    const { type, id } = value;
    if (!isNonEmptyString(id)) {
        return null;
    }
    if (type === "user") {
        return { type: "user", id };
    }
    if (type === "team") {
        return { type: "team", id };
    }
    return null;
}

// Reads an optional id condition; a present value that is not a usable id is kept raw in `leftover`.
function readOptionalId(
    source: Record<string, unknown>,
    key: string,
    leftover: Record<string, unknown>
): string | null {
    const value = source[key];
    if (isNonEmptyString(value)) {
        return value;
    }
    if (value !== undefined) {
        leftover[key] = value;
    }
    return null;
}

interface ReadConditions {
    requesterUserId: string | null;
    requesterTeamId: string | null;
    folder: RuleFolderValue | null;
    // Unknown condition keys and malformed editable conditions, kept raw.
    leftover: Record<string, unknown>;
}

function readConditions(value: unknown): ReadConditions {
    const source: Record<string, unknown> = isRecord(value) ? value : {};
    const leftover = copyUnknownKeys(source, KNOWN_CONDITION_KEYS);
    const requesterUserId = readOptionalId(source, "requesterUserId", leftover);
    const requesterTeamId = readOptionalId(source, "requesterTeamId", leftover);
    const folder = readFolder(source.folder);
    if (folder === null && source.folder !== undefined) {
        leftover.folder = source.folder;
    }

    return { requesterUserId, requesterTeamId, folder, leftover };
}

function readRule(source: Record<string, unknown>, id: string): RuleValue {
    const conditions = readConditions(source.conditions);
    const target = readTarget(source.target);
    const preserved = copyUnknownKeys(source, KNOWN_RULE_KEYS);
    if (Object.keys(conditions.leftover).length > 0) {
        preserved.conditions = conditions.leftover;
    }
    if (target === null && source.target !== undefined) {
        preserved.target = source.target;
    }

    return {
        id,
        requesterUserId: conditions.requesterUserId,
        requesterTeamId: conditions.requesterTeamId,
        folder: conditions.folder,
        target,
        preserved
    };
}

// A stored id is kept when it is usable and not seen yet (R314); every other rule gets a new one.
function pickRuleId(source: Record<string, unknown>, seen: Set<string>, taken: string[]): string {
    const stored = source.id;
    if (isNonEmptyString(stored) && !seen.has(stored)) {
        return stored;
    }
    const created = createRuleId(taken);
    taken.push(created);
    return created;
}

function readRules(value: unknown): RuleValue[] {
    if (!Array.isArray(value)) {
        return [];
    }
    const sources = value.filter(isRecord);
    // Every stored id is reserved first, so a generated id never collides with a later rule's id.
    const taken: string[] = [];
    for (const source of sources) {
        if (isNonEmptyString(source.id)) {
            taken.push(source.id);
        }
    }

    const seen = new Set<string>();
    const rules: RuleValue[] = [];
    for (const source of sources) {
        const id = pickRuleId(source, seen, taken);
        seen.add(id);
        const rule = readRule(source, id);
        rules.push(rule);
    }
    return rules;
}

/*
 * Parses the stored assignment object (`readReviewConfig(...).assignment`) into the typed value
 * (R293, R295, R314). `null` (a step without an assignment) reads as the review defaults. Nothing
 * the editor does not edit is dropped: `assignmentToConfig` writes it back.
 */
export const readAssignment = (assignment: Record<string, unknown> | null): AssignmentValue => {
    if (assignment === null) {
        return { strategy: "none", allowManualPick: false, rules: [], preserved: {} };
    }

    const preserved = copyUnknownKeys(assignment, KNOWN_ASSIGNMENT_KEYS);
    const stored = assignment.strategy;
    let strategy: AssignmentStrategy | null = null;
    if (isAssignmentStrategy(stored)) {
        strategy = stored;
    } else if (stored !== undefined) {
        preserved.strategy = stored;
    }

    return {
        strategy,
        allowManualPick: assignment.allowManualPick === true,
        rules: readRules(assignment.rules),
        preserved
    };
};
```

Create `packages/app-workflows/src/editor/model/assignment/assignmentToConfig.ts`:

```ts
import { isRecord } from "~/editor/model/isRecord.js";
import type { AssignmentValue } from "./AssignmentValue.js";
import type { RuleValue } from "./RuleValue.js";

function conditionsToConfig(rule: RuleValue): Record<string, unknown> {
    const conditions: Record<string, unknown> = {};
    const preserved = rule.preserved.conditions;
    if (isRecord(preserved)) {
        Object.assign(conditions, preserved);
    }
    if (rule.requesterUserId !== null) {
        conditions.requesterUserId = rule.requesterUserId;
    }
    if (rule.requesterTeamId !== null) {
        conditions.requesterTeamId = rule.requesterTeamId;
    }
    if (rule.folder !== null) {
        conditions.folder = {
            id: rule.folder.id,
            type: rule.folder.type,
            includeDescendants: rule.folder.includeDescendants
        };
    }
    return conditions;
}

function ruleToConfig(rule: RuleValue): Record<string, unknown> {
    const config: Record<string, unknown> = {};
    // The preserved keys first: the known keys below always win over them.
    Object.assign(config, rule.preserved);
    config.id = rule.id;
    config.conditions = conditionsToConfig(rule);
    if (rule.target !== null) {
        config.target = { type: rule.target.type, id: rule.target.id };
    }
    return config;
}

/*
 * The stored shape of an assignment (R293, R295): every key and condition the editor does not edit
 * is written back unchanged, an absent optional condition is omitted (never `null`), `conditions`
 * is always an object because the server requires it. Called only by `getPeopleStepPatch`.
 */
export const assignmentToConfig = (value: AssignmentValue): Record<string, unknown> => {
    const config: Record<string, unknown> = {};
    Object.assign(config, value.preserved);
    if (value.strategy !== null) {
        config.strategy = value.strategy;
    }
    config.allowManualPick = value.allowManualPick;
    config.rules = value.rules.map(ruleToConfig);
    return config;
};
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/model/createRuleId.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/assignment/readAssignment.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/assignment/assignmentToConfig.test.ts 2>&1 | tail -30
```

Expected: PASS. If the `retries when the first candidate is already taken` case fails, check that `ALPHABET.charAt(18)` is `s` (the alphabet starts at `a` for index 0).

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

Nothing existing changed in this task; the run proves the new files compile with the model folder.

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
git commit -m "feat(app-workflows): add the typed assignment model" -m "readAssignment parses the stored assignment into typed rules and assignmentToConfig writes it back losslessly: modelId, unknown condition, rule and assignment keys, a foreign folder type, an unknown strategy and an unknown target type survive. Rules without an id or with a duplicate id get ids at load; createRuleId is the only generator." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`AssignmentValue.strategy` is `AssignmentStrategy | null`**, not `AssignmentStrategy`. R314 keeps an unknown stored strategy unchanged with no card selected; a three-value type cannot say "none selected". The raw stored value waits in `assignment.preserved.strategy`. Consumers (Task 18 `AssignmentFormValues.strategy`, Task 20 strategy renderer, Task 12 summary, Task 17 signature) must accept `null`: the radio shows no card selected, the summary omits the strategy part, the Test routing request is refused by the server's schema until the admin picks one.
- **`createRuleId(existing: string[])`** takes the ids to avoid (the Produces entry of Task 9), R294 writes it without a parameter. The signature with the list is used; it also serves the load-time case of R314.
- **`RuleValue.preserved` layout** is fixed by this task: `preserved.conditions` is a record of the stored condition keys the editor does not edit (including a malformed editable one kept raw), `preserved.target` is a raw target of an unknown type, every other key is an unknown rule key. The contract says only "every unknown condition key and every unknown rule key"; the single record needs this layout to tell a rule key from a condition key of the same name.
- **A `folder` with extra keys beyond `id`, `type` and `includeDescendants`** reads as the three known keys (the server's stripping schema drops the rest on save). A folder missing one of the three is kept raw as an unknown condition.
- **Extra files not in the contract's file list:** `assignment/hasPreservedConditions.ts` (needed by Tasks 11 and 21) and `[AWET]/ruleFixtures.ts` (builders for the model tests of Tasks 9-13).

## Review fixes (sub-phase review)

- `AssignmentStrategy.ts` is created by Task 7 of 9b.3 (consistency ruling): the Create entry became a Modify entry that adds `ASSIGNMENT_STRATEGIES` below the type with an exact before/after hunk; the Produces entry no longer lists the type.
- Removed `yarn check:test:types -p app-workflows` from Step 5: the package has no `__tests__` folder, so it is not listed (8a R243); the build type-checks the co-located tests.
- Named the nested call arguments in four tests (`readAssignment`, `hasPreservedConditions`, `assignmentToConfig` calls inside `expect(...)`) per the no-nested-call-arguments rule.
- `readRules` no longer nests `readRule(...)` inside `rules.push(...)`.
