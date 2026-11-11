### Task 11: Reference labels, rule summary and rule issues

R298, R299, R313; D117; Q50, Q53, Q59.1; Review Focus 1, 4; design README 4 (`ruleSummary`, `ruleWarnings`), `research-spec.md` 4.2 and 4.4. Pure functions in `[AWE]/model/rules`: the label of a saved reference per state, the design's one-line rule summary, and the rule issues of two kinds (errors that block Save, warnings that never do).

- **Reference labels (R298, D117):** `getReferenceLabel({ kind, id, name, state })` builds a `ReferenceLabel`: a found reference shows its name (`Unknown item` when the name is `null`), a deleted one shows `Deleted user`, `Deleted team` or `Deleted folder`, a restricted folder shows `Restricted folder`. The presenter (Task 14) builds the `RuleReferences` maps with it. The muted look and the icons (`person_off`, `group_off`, `lock`) are the picker option mapper's job (Task 19b), keyed on `kind` and `state`; a `ReferenceLabel` carries no icon.
- **`RuleReferences`** holds what the editor has resolved: users, rule teams and folders by id, and `userTeamIds` (a user's team ids from `listUsers`, R286). An id that is not in a map is unresolved (not looked up yet, or the lookup failed); unresolved is never an issue.
- **`describeRule(rule, references)`** is the design's `ruleSummary`: conditions joined by ` and `, in the order requester user, requester team, folder: `requester is {User}`, `requester is in {Team}`, `content is in {path}` plus ` (incl. subfolders)` when `includeDescendants` (a deleted folder reads `a deleted folder`, a restricted one `a restricted folder`); prefix `If ` or `Always` when there are none; then ` → ` and the target: the user's name, `{Team} team pool` or `(no target)`. A name that is not resolved reads `Unknown item`; a deleted user or team reads its `Deleted ...` label. When the rule holds preserved conditions (R313, copy gap 11) ` and other conditions` follows the editable conditions, or the prefix is `If other conditions match` when there are none, so a summary never reads `Always` for a rule the server restricts.
- **`getRuleIssues(rules, context)` (R299)** returns `RuleIssue`s in rule order, within a rule in the order target, requester user, requester team, folder:

| Kind | Field | Condition | Message |
|---|---|---|---|
| error | `target` | no target | `Choose who this rule assigns to.` |
| error | `target` | user target resolved as deleted | `The assigned user was deleted.` |
| error | `target` | user target found, its `userTeamIds` known and none in the step's teams | `{Name} is no longer in the reviewing teams.` |
| error | `target` | team target resolved as deleted | `The team was deleted.` |
| error | `target` | team target not among the step's teams, its label resolved | `{Team} is not a reviewing team.` |
| warning | `requesterTeam` | requester team resolved as deleted | `The team was deleted.` |
| warning | `folder` | folder resolved as deleted | `The folder no longer exists.` |

  No issue for: a restricted folder (the field hint only), a deleted requester user (the label `Deleted user` only, copy gap 2), a user whose teams are unknown (the lookup failed or the id is not resolved), an unresolved reference of any kind. A deleted team target that is also outside the step's teams reports the deleted message only.

**Files:**
- Create: `packages/app-workflows/src/editor/model/rules/ReferenceLabel.ts`
- Create: `packages/app-workflows/src/editor/model/rules/RuleReferences.ts`
- Create: `packages/app-workflows/src/editor/model/rules/createEmptyRuleReferences.ts`
- Create: `packages/app-workflows/src/editor/model/rules/getReferenceLabel.ts`
- Create: `packages/app-workflows/src/editor/model/rules/describeRule.ts`
- Create: `packages/app-workflows/src/editor/model/rules/RuleIssue.ts`
- Create: `packages/app-workflows/src/editor/model/rules/RuleIssueContext.ts`
- Create: `packages/app-workflows/src/editor/model/rules/getRuleIssues.ts`
- Create: `packages/app-workflows/src/editor/model/rules/getReferenceLabel.test.ts`
- Create: `packages/app-workflows/src/editor/model/rules/describeRule.test.ts`
- Create: `packages/app-workflows/src/editor/model/rules/getRuleIssues.test.ts`
- Modify: `packages/app-workflows/src/editor/testing/ruleFixtures.ts`

**Interfaces:**
- Consumes: Task 9 (`RuleValue`, `hasPreservedConditions`, `createRuleValue`).
- Produces: `ReferenceKind = "user" | "team" | "folder"`, `ReferenceState = "found" | "deleted" | "restricted"`, `ReferenceLabel { id: string; label: string; state: ReferenceState }` (all three in `ReferenceLabel.ts`), `RuleReferences { users: ReadonlyMap<string, ReferenceLabel>; teams: ReadonlyMap<string, ReferenceLabel>; folders: ReadonlyMap<string, ReferenceLabel>; userTeamIds: ReadonlyMap<string, string[]> }`, `createEmptyRuleReferences(): RuleReferences`, `getReferenceLabel(params: ReferenceLabelParams): ReferenceLabel` with `ReferenceLabelParams { kind: ReferenceKind; id: string; name: string | null; state: ReferenceState }`, `describeRule(rule: RuleValue, references: RuleReferences): string`, `RuleIssue { ruleId: string; index: number; kind: "error" | "warning"; field: "target" | "requesterUser" | "requesterTeam" | "folder"; message: string }`, `RuleIssueContext { stepTeamIds: string[]; references: RuleReferences }`, `getRuleIssues(rules: RuleValue[], context: RuleIssueContext): RuleIssue[]`, fixtures `createReferenceLabel(overrides?)` and `createRuleReferences(entries?)` in `[AWET]/ruleFixtures.ts`.

**Test runner note:** admin package, `yarn test <path>` only. Plain `.ts` tests.

- [ ] **Step 1: Write the failing tests**

Modify `packages/app-workflows/src/editor/testing/ruleFixtures.ts`. Replace the two import lines at the top:

```ts
import type { AssignmentValue } from "~/editor/model/assignment/AssignmentValue.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
```

with:

```ts
import type { AssignmentValue } from "~/editor/model/assignment/AssignmentValue.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import type { ReferenceLabel } from "~/editor/model/rules/ReferenceLabel.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";
```

and append at the end of the file:

```ts
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
```

Create `packages/app-workflows/src/editor/model/rules/getReferenceLabel.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getReferenceLabel } from "./getReferenceLabel.js";

describe("getReferenceLabel (R298, D117)", () => {
    it("shows the name of a found reference", () => {
        expect(
            getReferenceLabel({ kind: "user", id: "user-1", name: "Ivan Horvat", state: "found" })
        ).toEqual({ id: "user-1", label: "Ivan Horvat", state: "found" });
        expect(
            getReferenceLabel({ kind: "team", id: "team-1", name: "Marketing", state: "found" })
        ).toEqual({ id: "team-1", label: "Marketing", state: "found" });
        expect(
            getReferenceLabel({ kind: "folder", id: "f1", name: "/Campaigns", state: "found" })
        ).toEqual({ id: "f1", label: "/Campaigns", state: "found" });
    });

    it("shows Unknown item for a found reference without a name", () => {
        const label = getReferenceLabel({ kind: "user", id: "user-1", name: null, state: "found" });

        expect(label.label).toBe("Unknown item");
    });

    it("names a deleted user, team and folder", () => {
        const user = getReferenceLabel({ kind: "user", id: "u", name: null, state: "deleted" });
        const team = getReferenceLabel({ kind: "team", id: "t", name: null, state: "deleted" });
        const folder = getReferenceLabel({ kind: "folder", id: "f", name: null, state: "deleted" });

        expect(user).toEqual({ id: "u", label: "Deleted user", state: "deleted" });
        expect(team).toEqual({ id: "t", label: "Deleted team", state: "deleted" });
        expect(folder).toEqual({ id: "f", label: "Deleted folder", state: "deleted" });
    });

    it("names a restricted folder and ignores any name it was given", () => {
        const label = getReferenceLabel({
            kind: "folder",
            id: "f9",
            name: "/Partners",
            state: "restricted"
        });

        expect(label).toEqual({ id: "f9", label: "Restricted folder", state: "restricted" });
    });
});
```

Create `packages/app-workflows/src/editor/model/rules/describeRule.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { createRuleReferences } from "~/editor/testing/ruleFixtures.js";
import { createRuleValue } from "~/editor/testing/ruleFixtures.js";
import { describeRule } from "./describeRule.js";

const references = createRuleReferences({
    users: [
        createReferenceLabel({ id: "user-iv", label: "Ivan Horvat" }),
        createReferenceLabel({ id: "user-gone", label: "Deleted user", state: "deleted" })
    ],
    teams: [
        createReferenceLabel({ id: "team-m", label: "Marketing" }),
        createReferenceLabel({ id: "team-l", label: "Legal" }),
        createReferenceLabel({ id: "team-gone", label: "Deleted team", state: "deleted" })
    ],
    folders: [
        createReferenceLabel({ id: "f1", label: "/Campaigns" }),
        createReferenceLabel({ id: "f9", label: "Restricted folder", state: "restricted" }),
        createReferenceLabel({ id: "fx", label: "Deleted folder", state: "deleted" })
    ]
});

describe("describeRule: the design's summary", () => {
    it("reads the design example", () => {
        const rule = createRuleValue({
            requesterTeamId: "team-m",
            folder: { id: "f1", type: "cms:article", includeDescendants: true },
            target: { type: "user", id: "user-iv" }
        });

        expect(describeRule(rule, references)).toBe(
            "If requester is in Marketing and content is in /Campaigns (incl. subfolders) → Ivan Horvat"
        );
    });

    it("says Always for a rule without conditions and names a team pool target", () => {
        const rule = createRuleValue({ target: { type: "team", id: "team-l" } });

        expect(describeRule(rule, references)).toBe("Always → Legal team pool");
    });

    it("joins the three conditions in the order requester, team, folder", () => {
        const rule = createRuleValue({
            requesterUserId: "user-iv",
            requesterTeamId: "team-m",
            folder: { id: "f1", type: "cms:article", includeDescendants: false },
            target: { type: "team", id: "team-l" }
        });

        expect(describeRule(rule, references)).toBe(
            "If requester is Ivan Horvat and requester is in Marketing and content is in /Campaigns → Legal team pool"
        );
    });

    it("says (no target) for a rule without a target", () => {
        expect(describeRule(createRuleValue({ target: null }), references)).toBe(
            "Always → (no target)"
        );
    });

    it("names a deleted folder and a restricted folder as the design does", () => {
        const deleted = createRuleValue({
            folder: { id: "fx", type: "cms:article", includeDescendants: false },
            target: { type: "team", id: "team-l" }
        });
        const restricted = createRuleValue({
            folder: { id: "f9", type: "cms:article", includeDescendants: true },
            target: { type: "team", id: "team-l" }
        });

        expect(describeRule(deleted, references)).toBe(
            "If content is in a deleted folder → Legal team pool"
        );
        expect(describeRule(restricted, references)).toBe(
            "If content is in a restricted folder (incl. subfolders) → Legal team pool"
        );
    });

    it("shows the Deleted labels of a deleted user and team", () => {
        const rule = createRuleValue({
            requesterUserId: "user-gone",
            requesterTeamId: "team-gone",
            target: { type: "user", id: "user-gone" }
        });

        expect(describeRule(rule, references)).toBe(
            "If requester is Deleted user and requester is in Deleted team → Deleted user"
        );
    });

    it("says Unknown item for a reference that is not resolved", () => {
        const rule = createRuleValue({
            requesterUserId: "user-new",
            target: { type: "user", id: "user-new" }
        });

        expect(describeRule(rule, references)).toBe(
            "If requester is Unknown item → Unknown item"
        );
    });
});

describe("describeRule: a folder that is not resolved", () => {
    it("says Unknown item for a folder condition that is not resolved yet", () => {
        const rule = createRuleValue({
            folder: { id: "f-new", type: "cms:article", includeDescendants: false },
            target: { type: "team", id: "team-l" }
        });

        expect(describeRule(rule, references)).toBe(
            "If content is in Unknown item → Legal team pool"
        );
    });
});

describe("describeRule: conditions the editor cannot show (R313)", () => {
    it("appends and other conditions after the editable conditions", () => {
        const rule = createRuleValue({
            requesterTeamId: "team-m",
            target: { type: "user", id: "user-iv" },
            preserved: { conditions: { modelId: "article" } }
        });

        expect(describeRule(rule, references)).toBe(
            "If requester is in Marketing and other conditions → Ivan Horvat"
        );
    });

    it("says If other conditions match for a rule with only a modelId condition", () => {
        const rule = createRuleValue({
            target: { type: "team", id: "team-l" },
            preserved: { conditions: { modelId: "article" } }
        });

        expect(describeRule(rule, references)).toBe("If other conditions match → Legal team pool");
    });

    it("does not count a preserved rule key as a condition", () => {
        const rule = createRuleValue({
            target: { type: "team", id: "team-l" },
            preserved: { futureRuleKey: true }
        });

        expect(describeRule(rule, references)).toBe("Always → Legal team pool");
    });
});
```

Create `packages/app-workflows/src/editor/model/rules/getRuleIssues.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/model/rules/getReferenceLabel.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/rules/describeRule.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/rules/getRuleIssues.test.ts 2>&1 | tail -30
```

Expected: each fails with `Failed to resolve import` for `./getReferenceLabel.js`, `./describeRule.js`, `./getRuleIssues.js` or `./RuleIssueContext.js`. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/model/rules/ReferenceLabel.ts`:

```ts
// What a saved reference points at: a user, a team (a rule's, not the step's own) or a folder.
export type ReferenceKind = "user" | "team" | "folder";

// `found` resolved by name, `deleted` the lookup says it does not exist, `restricted` a folder that exists but the admin cannot see (D69, D117).
export type ReferenceState = "found" | "deleted" | "restricted";

export interface ReferenceLabel {
    id: string;
    label: string;
    state: ReferenceState;
}
```

Create `packages/app-workflows/src/editor/model/rules/RuleReferences.ts`:

```ts
import type { ReferenceLabel } from "./ReferenceLabel.js";

/*
 * What the editor has resolved for the references of the rules (R298). An id missing from a map is
 * unresolved (not looked up yet, or the lookup failed) and is never an issue. `userTeamIds` is a
 * user's team ids from `listUsers` (R286); a user without an entry has unknown teams.
 */
export interface RuleReferences {
    users: ReadonlyMap<string, ReferenceLabel>;
    teams: ReadonlyMap<string, ReferenceLabel>;
    folders: ReadonlyMap<string, ReferenceLabel>;
    userTeamIds: ReadonlyMap<string, string[]>;
}
```

Create `packages/app-workflows/src/editor/model/rules/createEmptyRuleReferences.ts`:

```ts
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
```

Create `packages/app-workflows/src/editor/model/rules/getReferenceLabel.ts`:

```ts
import type { ReferenceKind } from "./ReferenceLabel.js";
import type { ReferenceLabel } from "./ReferenceLabel.js";
import type { ReferenceState } from "./ReferenceLabel.js";

const UNKNOWN_ITEM = "Unknown item";
const RESTRICTED_FOLDER = "Restricted folder";

const DELETED_LABELS: Record<ReferenceKind, string> = {
    user: "Deleted user",
    team: "Deleted team",
    folder: "Deleted folder"
};

export interface ReferenceLabelParams {
    kind: ReferenceKind;
    id: string;
    // The user's or team's name, the folder's path; `null` when the lookup gave none.
    name: string | null;
    state: ReferenceState;
}

/*
 * The label of a saved reference per state (R298, D117): the name when found, `Deleted user`,
 * `Deleted team` or `Deleted folder` when the lookup says it is gone, `Restricted folder` for a
 * folder the admin cannot see (its name is never shown). The muted look and the icon belong to the
 * picker option mapper.
 */
export const getReferenceLabel = (params: ReferenceLabelParams): ReferenceLabel => {
    if (params.state === "restricted") {
        return { id: params.id, label: RESTRICTED_FOLDER, state: params.state };
    }
    if (params.state === "deleted") {
        return { id: params.id, label: DELETED_LABELS[params.kind], state: params.state };
    }
    const label = params.name === null ? UNKNOWN_ITEM : params.name;

    return { id: params.id, label, state: params.state };
};
```

Create `packages/app-workflows/src/editor/model/rules/describeRule.ts`:

```ts
import { hasPreservedConditions } from "~/editor/model/assignment/hasPreservedConditions.js";
import type { RuleFolderValue } from "~/editor/model/assignment/RuleFolderValue.js";
import type { RuleTargetValue } from "~/editor/model/assignment/RuleTargetValue.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import type { ReferenceLabel } from "./ReferenceLabel.js";
import type { RuleReferences } from "./RuleReferences.js";

const UNKNOWN_ITEM = "Unknown item";

function getLabel(map: ReadonlyMap<string, ReferenceLabel>, id: string): string {
    const reference = map.get(id);
    return reference === undefined ? UNKNOWN_ITEM : reference.label;
}

function describeFolder(folder: RuleFolderValue, references: RuleReferences): string {
    const reference = references.folders.get(folder.id);
    let text = UNKNOWN_ITEM;
    if (reference !== undefined) {
        text = reference.label;
    }
    if (reference !== undefined && reference.state === "deleted") {
        text = "a deleted folder";
    }
    if (reference !== undefined && reference.state === "restricted") {
        text = "a restricted folder";
    }
    const subfolders = folder.includeDescendants ? " (incl. subfolders)" : "";

    return `content is in ${text}${subfolders}`;
}

function describeConditions(rule: RuleValue, references: RuleReferences): string[] {
    const conditions: string[] = [];
    if (rule.requesterUserId !== null) {
        const name = getLabel(references.users, rule.requesterUserId);
        conditions.push(`requester is ${name}`);
    }
    if (rule.requesterTeamId !== null) {
        const name = getLabel(references.teams, rule.requesterTeamId);
        conditions.push(`requester is in ${name}`);
    }
    if (rule.folder !== null) {
        const folder = describeFolder(rule.folder, references);
        conditions.push(folder);
    }
    return conditions;
}

function describeTarget(target: RuleTargetValue | null, references: RuleReferences): string {
    if (target === null) {
        return "(no target)";
    }
    if (target.type === "user") {
        return getLabel(references.users, target.id);
    }
    const team = getLabel(references.teams, target.id);

    return `${team} team pool`;
}

function describePrefix(rule: RuleValue, conditions: string[]): string {
    const hasOthers = hasPreservedConditions(rule);
    if (conditions.length > 0) {
        const others = hasOthers ? " and other conditions" : "";
        return `If ${conditions.join(" and ")}${others}`;
    }
    if (hasOthers) {
        return "If other conditions match";
    }
    return "Always";
}

/*
 * The one-line summary of a rule (the design's `ruleSummary`, R313): `If requester is in Marketing
 * and content is in /Campaigns (incl. subfolders) → Ivan Horvat`, or `Always → Legal team pool`.
 * The clause for conditions the editor cannot show is copy gap 11.
 */
export const describeRule = (rule: RuleValue, references: RuleReferences): string => {
    const conditions = describeConditions(rule, references);
    const prefix = describePrefix(rule, conditions);
    const target = describeTarget(rule.target, references);

    return `${prefix} → ${target}`;
};
```

Create `packages/app-workflows/src/editor/model/rules/RuleIssue.ts`:

```ts
/*
 * A problem of one rule. `error` blocks Save and is shown destructive, `warning` never blocks.
 * `index` is the rule's position at the time the issues were computed (0-based); the strip text
 * `Rule {n}:` is `index + 1`.
 */
export interface RuleIssue {
    ruleId: string;
    index: number;
    kind: "error" | "warning";
    field: "target" | "requesterUser" | "requesterTeam" | "folder";
    message: string;
}
```

Create `packages/app-workflows/src/editor/model/rules/RuleIssueContext.ts`:

```ts
import type { RuleReferences } from "./RuleReferences.js";

export interface RuleIssueContext {
    // The step's reviewing teams (`config.teams`).
    stepTeamIds: string[];
    references: RuleReferences;
}
```

Create `packages/app-workflows/src/editor/model/rules/getRuleIssues.ts`:

```ts
import type { RuleTargetValue } from "~/editor/model/assignment/RuleTargetValue.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import type { RuleIssue } from "./RuleIssue.js";
import type { RuleIssueContext } from "./RuleIssueContext.js";

const NO_TARGET = "Choose who this rule assigns to.";
const USER_DELETED = "The assigned user was deleted.";
const TEAM_DELETED = "The team was deleted.";
const FOLDER_DELETED = "The folder no longer exists.";

function getUserTargetMessage(target: RuleTargetValue, context: RuleIssueContext): string | null {
    const reference = context.references.users.get(target.id);
    if (reference === undefined) {
        return null;
    }
    if (reference.state === "deleted") {
        return USER_DELETED;
    }
    // A user whose teams are unknown (the lookup failed) is not flagged.
    const teamIds = context.references.userTeamIds.get(target.id);
    if (teamIds === undefined) {
        return null;
    }
    const isMember = teamIds.some(id => context.stepTeamIds.includes(id));
    if (isMember) {
        return null;
    }
    return `${reference.label} is no longer in the reviewing teams.`;
}

function getTeamTargetMessage(target: RuleTargetValue, context: RuleIssueContext): string | null {
    const reference = context.references.teams.get(target.id);
    if (reference !== undefined && reference.state === "deleted") {
        return TEAM_DELETED;
    }
    if (context.stepTeamIds.includes(target.id)) {
        return null;
    }
    // Without a resolved name the message cannot name the team yet; the server still refuses it.
    if (reference === undefined) {
        return null;
    }
    return `${reference.label} is not a reviewing team.`;
}

function getTargetMessage(rule: RuleValue, context: RuleIssueContext): string | null {
    const target = rule.target;
    if (target === null) {
        return NO_TARGET;
    }
    if (target.type === "user") {
        return getUserTargetMessage(target, context);
    }
    return getTeamTargetMessage(target, context);
}

function createIssue(
    rule: RuleValue,
    index: number,
    kind: RuleIssue["kind"],
    field: RuleIssue["field"],
    message: string
): RuleIssue {
    return { ruleId: rule.id, index, kind, field, message };
}

function getIssuesOfRule(rule: RuleValue, index: number, context: RuleIssueContext): RuleIssue[] {
    const issues: RuleIssue[] = [];

    const targetMessage = getTargetMessage(rule, context);
    if (targetMessage !== null) {
        const targetIssue = createIssue(rule, index, "error", "target", targetMessage);
        issues.push(targetIssue);
    }

    // A deleted requester user has its label only (copy gap 2): no issue.
    if (rule.requesterTeamId !== null) {
        const team = context.references.teams.get(rule.requesterTeamId);
        if (team !== undefined && team.state === "deleted") {
            const teamIssue = createIssue(rule, index, "warning", "requesterTeam", TEAM_DELETED);
            issues.push(teamIssue);
        }
    }

    // A restricted folder has the field hint only (copy gap 1): no issue.
    if (rule.folder !== null) {
        const folder = context.references.folders.get(rule.folder.id);
        if (folder !== undefined && folder.state === "deleted") {
            const folderIssue = createIssue(rule, index, "warning", "folder", FOLDER_DELETED);
            issues.push(folderIssue);
        }
    }

    return issues;
}

/*
 * The issues of a rule list (R299, Q50, Q53, Q59.1). Errors (no target, a user or team target
 * outside the reviewing teams, a deleted user or team target) block Save; warnings (a deleted
 * requester team, a deleted folder) never do. Pure and computed from what is resolved: an
 * unresolved reference, or a user whose teams are unknown, is never flagged.
 */
export const getRuleIssues = (rules: RuleValue[], context: RuleIssueContext): RuleIssue[] => {
    const issues: RuleIssue[] = [];
    rules.forEach((rule, index) => {
        const ruleIssues = getIssuesOfRule(rule, index, context);
        issues.push(...ruleIssues);
    });
    return issues;
};
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/model/rules/getReferenceLabel.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/rules/describeRule.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/rules/getRuleIssues.test.ts 2>&1 | tail -30
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
git commit -m "feat(app-workflows): add reference labels, rule summaries and rule issues" -m "getReferenceLabel names a saved user, team or folder per state (found, deleted, restricted), describeRule reads a rule as the design's one-line summary including a clause for conditions the editor cannot show, and getRuleIssues returns blocking errors (no target, stale or deleted target) and non-blocking warnings (deleted folder, deleted requester team) without flagging anything unresolved." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`ReferenceLabel` has no icon.** The contract says `getReferenceLabel` gives "the R298 labels and icons" but fixes `ReferenceLabel { id; label; state }`. The icons (`person_off`, `group_off`, `lock`) belong to `PickerOption.icon` (R307, a closed name union created in Task 19), so Task 19b's `toReferencePickerOption` maps `kind` and `state` to the icon name. This task keeps the label and state only.
- **`getReferenceLabel` signature is this task's choice** (the contract names the file and the behaviour, not the signature): `getReferenceLabel({ kind, id, name, state })`. Task 14 builds the `RuleReferences` maps with it; Task 19b may call it for a saved value that is not in a map.
- **Unresolved team target outside the step's teams is not an error** until its name resolves, because the message `{Team} is not a reviewing team.` needs the name and there is no source copy for a nameless variant. The server's save check (Task 3) still refuses it with the rule error.
- **`describeRule` shows the `Deleted ...` labels as they are** for a deleted user, team or folder target or requester (`requester is Deleted user`), except a deleted or restricted folder condition, which reads `a deleted folder` and `a restricted folder` as in the design's `ruleSummary`.
- **Extra files:** `createEmptyRuleReferences.ts` (Tasks 12 and 14 start from it) and the two fixture builders in `[AWET]/ruleFixtures.ts`.

## Review fixes (sub-phase review)

- Removed `yarn check:test:types -p app-workflows` from Step 5 (8a R243).
- `getRuleIssues`, `describeRule` and the `createRuleReferences` fixture no longer nest a call as the argument of another call (`issues.push(createIssue(...))`, `issues.push(...getIssuesOfRule(...))`, `conditions.push(describeFolder(...))`, `new Map(Object.entries(...))`).
- Added a `describeRule` test for a folder condition that is not resolved (reads `Unknown item`, the documented rule for any unresolved reference).
- Checked against R298, R299, R313 and Q50, Q53, Q59.1: messages, field names and the error/warning split match; `ReferenceLabel` has no icon (consistency item); `createEmptyRuleReferences` and the fixture builders are the names later sub-phases import.
