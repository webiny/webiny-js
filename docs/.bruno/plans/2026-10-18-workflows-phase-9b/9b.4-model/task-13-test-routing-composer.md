### Task 13: Test routing composer and signature

R300, R301; Q55, Q59.2, Q59.3; Review Focus 6, 7; design README 4 (`research-spec.md` 4.5, Test routing tab) and copy gaps 4, 5 and 10. Two pure pieces for the Test routing tab: `getTestRoutingSignature` (what makes a result stale) and `composeTestRoutingResult` (the design's sentences, composed from the server's inspection, the rules of the request and the resolved names). The presenter (Task 17) calls them; nothing here knows MobX, React or the DI container.

- **Signature (R300):** `getTestRoutingSignature(input)` is `JSON.stringify([stepId, teams, strategy, allowManualPick, rules, requesterId, folderId])`, the design prototype's signature. `TestRoutingInput` holds only those values, so no unrelated step field (title, colour, notifications, instructions) can change it. A rule edit, a reorder, an added or removed rule, a changed team, strategy, toggle, requester or folder each give another string.
- **Composition (R301):** `composeTestRoutingResult(inspection, context)` returns the render-ready `TestRoutingResultVm`. The inspection is the server's answer for the rules of the request; `context.rules` must be those same rules, so a stale result keeps its old numbering (R300).
  - **Owner:** `ownerLabel` is the person's name or `Team pool`; `ownerIcon` is `person` or `groups`.
  - **Reason line**, with `n` the 1-based position of `inspection.ruleId` (its index in `context.rules`, else in the inspection's trace; a rule id found in neither is treated as no rule):
    - a person chosen by a rule: `Assigned by rule {n}`;
    - a person chosen by the strategy: `Round-robin chose {Name}.` / `Least-loaded chose {Name}.`, and with a narrowed team and a rule `Rule {n} narrowed it to the {Team} team; round-robin chose {Name}.` / `Rule {n} narrowed it to the {Team} team; least-loaded chose {Name}.`;
    - the pool, strategy none: `Rule {n} sent it to the {Team} team pool.` for a rule that narrowed to a team (the `{Team}` name is the narrowed team's), `Assigned by rule {n}` for a rule without a narrowed team, `No rule matched; waits in the team pool.` without a rule;
    - the pool, strategy round-robin or least-loaded (nobody eligible): `Sent to team pool: all candidates were skipped.`
  - **Trace rows:** one row per entry of `inspection.trace` in the server's order (every rule, R289). Tag `Matched` / `Not matched` / `Skipped`; label `Rule {n}: {describeRule(...)}`, or `Rule {n}` alone when the rule id is not among `context.rules` (it never throws); `n` is the rule's position in `context.rules` (else its position in the trace). Reason by outcome: `matched` the server reason, else `All conditions match.`; `notMatched` the failed conditions joined with ` and ` and capitalised (`Requester is not {User}.`, `Requester is not in {Team}.`, `Content is not in {path}` plus ` or its subfolders` when the rule includes subfolders, `the restricted folder` for a restricted folder), else the server reason, else `A condition on this rule does not match.` (copy gap 10); `skipped` the server reason verbatim, else the same fallback; `notEvaluated` tag `Skipped` with `An earlier rule matched.` (copy gap 5).
  - **Strategy line:** `Not used: a rule chose the reviewer.` (source `rule`); `None: the step waits in the team pool.`; `{Round-robin|Least-loaded}: no eligible candidate.` (no owner); `Round-robin across {up to 3 names}[ and others]: {Name} is next in rotation.` (the names are `candidateIds` in the server's order, `and others` when `candidateCount` is larger than the ids sent); `Least-loaded chose {Name}: fewest open reviews.`
  - **Skipped people:** `{name, reason}` with the server's reason verbatim; the name is the server's `displayName`, else the resolved name, else `Deleted user` (copy gap 4).
  - **Names:** `getInspectionUserName(userId, context)` takes `context.names.users`, then the label in `context.references.users`, then `Deleted user`; `getInspectionTeamName(teamId, context)` takes `context.names.teams`, then `context.references.teams`, then `Deleted team`. A name that is not known never throws.

**Files:**
- Create: `packages/app-workflows/src/editor/model/testRouting/TestRoutingInput.ts`
- Create: `packages/app-workflows/src/editor/model/testRouting/TestRoutingResultVm.ts`
- Create: `packages/app-workflows/src/editor/model/testRouting/TestRoutingContext.ts`
- Create: `packages/app-workflows/src/editor/model/testRouting/getTestRoutingSignature.ts`
- Create: `packages/app-workflows/src/editor/model/testRouting/getInspectionUserName.ts`
- Create: `packages/app-workflows/src/editor/model/testRouting/getInspectionTeamName.ts`
- Create: `packages/app-workflows/src/editor/model/testRouting/getRulePosition.ts`
- Create: `packages/app-workflows/src/editor/model/testRouting/describeFailedConditions.ts`
- Create: `packages/app-workflows/src/editor/model/testRouting/composeTraceRows.ts`
- Create: `packages/app-workflows/src/editor/model/testRouting/composeReasonLine.ts`
- Create: `packages/app-workflows/src/editor/model/testRouting/composeStrategyLine.ts`
- Create: `packages/app-workflows/src/editor/model/testRouting/composeSkippedPeople.ts`
- Create: `packages/app-workflows/src/editor/model/testRouting/composeTestRoutingResult.ts`
- Create: `packages/app-workflows/src/editor/model/testRouting/getTestRoutingSignature.test.ts`
- Create: `packages/app-workflows/src/editor/model/testRouting/composeTestRoutingResult.test.ts`

**Interfaces:**
- Consumes: Task 7 of 9b.3 (`RoutingInspection { owner: RoutingOwner | null; source: RoutingSource; ruleId: string | null; strategy: AssignmentStrategy; narrowedTeamId: string | null; candidateIds: string[]; candidateCount: number; trace: RoutingTraceEntry[]; skipped: RoutingSkippedPerson[] }`, `RoutingTraceEntry { ruleId: string; outcome: RoutingTraceOutcome; reason: string | null; failedConditions: RoutingCondition[] }`, `RoutingSkippedPerson { userId: string; displayName: string | null; reason: string }`, `RoutingOwner { id: string; displayName: string }`, all exported from `~/editor/domain/types.js`; `RoutingTraceOutcome` is `"matched" | "notMatched" | "skipped" | "notEvaluated"`, `RoutingCondition` is `"requesterUser" | "requesterTeam" | "folder"`, `RoutingSource` is `"picked" | "rule" | "roundRobin" | "leastLoaded" | "pool"` (verify: the values Task 7 gave its unions; the SDL of Task 4 fixes the first two, the API `RoutingSource` the last)), Task 9 (`RuleValue`, `AssignmentStrategy`, `createRuleValue`), Task 11 (`RuleReferences`, `describeRule`, `createRuleReferences`, `createReferenceLabel`).
- Produces (all in `[AWE]/model/testRouting`): `TestRoutingInput { stepId: string; teams: string[]; strategy: AssignmentStrategy | null; allowManualPick: boolean; rules: RuleValue[]; requesterId: string | null; folderId: string | null }`, `getTestRoutingSignature(input: TestRoutingInput): string`, `TestRoutingTag = "Matched" | "Not matched" | "Skipped"`, `TestRoutingRowVm { ruleId: string; tag: TestRoutingTag; label: string; reason: string }`, `TestRoutingSkippedVm { name: string; reason: string }`, `TestRoutingResultVm { ownerLabel: string; ownerIcon: "person" | "groups"; reason: string; trace: TestRoutingRowVm[]; strategyLine: string; skipped: TestRoutingSkippedVm[] }`, `InspectionNames { users: ReadonlyMap<string, string>; teams: ReadonlyMap<string, string> }` and `TestRoutingContext { rules: RuleValue[]; strategy: AssignmentStrategy | null; references: RuleReferences; names: InspectionNames }` (both in `TestRoutingContext.ts`), `composeTestRoutingResult(inspection: RoutingInspection, context: TestRoutingContext): TestRoutingResultVm`.

**Test runner note:** admin package, `yarn test <path>` only. Plain `.ts` tests; the tests build their inspections inline so they do not depend on the 9b.3 fixture names.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/model/testRouting/getTestRoutingSignature.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createRuleValue } from "~/editor/testing/ruleFixtures.js";
import { getTestRoutingSignature } from "./getTestRoutingSignature.js";
import type { TestRoutingInput } from "./TestRoutingInput.js";

const input = (overrides: Partial<TestRoutingInput> = {}): TestRoutingInput => {
    return {
        stepId: "step-1",
        teams: ["team-1"],
        strategy: "none",
        allowManualPick: false,
        rules: [createRuleValue({ id: "a" }), createRuleValue({ id: "b" })],
        requesterId: "user-1",
        folderId: null,
        ...overrides
    };
};

describe("getTestRoutingSignature (R300)", () => {
    it("is the same for the same input", () => {
        const first = getTestRoutingSignature(input());
        const second = getTestRoutingSignature(input());

        expect(first).toBe(second);
    });

    it("changes with the step", () => {
        const base = getTestRoutingSignature(input());

        const other = getTestRoutingSignature(input({ stepId: "step-2" }));

        expect(other).not.toBe(base);
    });

    it("changes with the teams", () => {
        const base = getTestRoutingSignature(input());

        const moreTeams = getTestRoutingSignature(input({ teams: ["team-1", "team-2"] }));
        const noTeams = getTestRoutingSignature(input({ teams: [] }));

        expect(moreTeams).not.toBe(base);
        expect(noTeams).not.toBe(base);
    });

    it("changes with the strategy, also from none to an unknown stored one", () => {
        const base = getTestRoutingSignature(input());

        const roundRobin = getTestRoutingSignature(input({ strategy: "roundRobin" }));
        const leastLoaded = getTestRoutingSignature(input({ strategy: "leastLoaded" }));
        const unknown = getTestRoutingSignature(input({ strategy: null }));

        expect(roundRobin).not.toBe(base);
        expect(leastLoaded).not.toBe(base);
        expect(unknown).not.toBe(base);
    });

    it("changes with the pick toggle", () => {
        const base = getTestRoutingSignature(input());

        const picking = getTestRoutingSignature(input({ allowManualPick: true }));

        expect(picking).not.toBe(base);
    });

    it("changes with any edit of the rules", () => {
        const base = getTestRoutingSignature(input());
        const [a, b] = input().rules;

        const reordered = input({ rules: [b, a] });
        const removed = input({ rules: [a] });
        const added = input({ rules: [a, b, createRuleValue({ id: "c" })] });
        const retargeted = input({
            rules: [{ ...a, target: { type: "user", id: "user-9" } }, b]
        });
        const withFolder = input({
            rules: [
                { ...a, folder: { id: "f1", type: "cms:article", includeDescendants: false } },
                b
            ]
        });

        for (const changed of [reordered, removed, added, retargeted, withFolder]) {
            const signature = getTestRoutingSignature(changed);

            expect(signature).not.toBe(base);
        }
    });

    it("changes with the requester and the folder", () => {
        const base = getTestRoutingSignature(input());

        const otherRequester = getTestRoutingSignature(input({ requesterId: "user-2" }));
        const noRequester = getTestRoutingSignature(input({ requesterId: null }));
        const withFolder = getTestRoutingSignature(input({ folderId: "f1" }));

        expect(otherRequester).not.toBe(base);
        expect(noRequester).not.toBe(base);
        expect(withFolder).not.toBe(base);
    });

    it("does not change with a field that is not an input of the test", () => {
        const withUnrelated = { ...input(), title: "Another title", color: "#ff0000" };

        const unrelated = getTestRoutingSignature(withUnrelated);
        const base = getTestRoutingSignature(input());

        expect(unrelated).toBe(base);
    });
});
```

Create `packages/app-workflows/src/editor/model/testRouting/composeTestRoutingResult.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { RoutingInspection } from "~/editor/domain/types.js";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { createRuleReferences } from "~/editor/testing/ruleFixtures.js";
import { createRuleValue } from "~/editor/testing/ruleFixtures.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";
import { composeTestRoutingResult } from "./composeTestRoutingResult.js";
import type { InspectionNames } from "./TestRoutingContext.js";
import type { TestRoutingContext } from "./TestRoutingContext.js";

const RULES = [
    createRuleValue({
        id: "r1",
        requesterTeamId: "team-m",
        target: { type: "user", id: "user-iv" }
    }),
    createRuleValue({
        id: "r2",
        folder: { id: "f1", type: "cms:article", includeDescendants: true },
        target: { type: "team", id: "team-l" }
    }),
    createRuleValue({
        id: "r3",
        requesterUserId: "user-iv",
        requesterTeamId: "team-m",
        folder: { id: "f1", type: "cms:article", includeDescendants: true },
        target: { type: "team", id: "team-l" }
    }),
    createRuleValue({
        id: "r4",
        folder: { id: "f1", type: "cms:article", includeDescendants: false },
        target: { type: "team", id: "team-l" }
    })
];

const REFERENCES = createRuleReferences({
    users: [createReferenceLabel({ id: "user-iv", label: "Ivan Horvat" })],
    teams: [
        createReferenceLabel({ id: "team-m", label: "Marketing" }),
        createReferenceLabel({ id: "team-l", label: "Legal" })
    ],
    folders: [createReferenceLabel({ id: "f1", label: "/Campaigns" })]
});

const names = (
    users: Record<string, string> = {},
    teams: Record<string, string> = {}
): InspectionNames => {
    return { users: new Map(Object.entries(users)), teams: new Map(Object.entries(teams)) };
};

const context = (overrides: Partial<TestRoutingContext> = {}): TestRoutingContext => {
    return {
        rules: RULES,
        strategy: "none",
        references: REFERENCES,
        names: names(),
        ...overrides
    };
};

const inspection = (overrides: Partial<RoutingInspection> = {}): RoutingInspection => {
    return {
        owner: null,
        source: "pool",
        ruleId: null,
        strategy: "none",
        narrowedTeamId: null,
        candidateIds: [],
        candidateCount: 0,
        trace: [],
        skipped: [],
        ...overrides
    };
};

const notMatched = (
    ruleId: string,
    failedConditions: RoutingInspection["trace"][number]["failedConditions"],
    reason: string | null = null
): RoutingInspection["trace"][number] => {
    return { ruleId, outcome: "notMatched", reason, failedConditions };
};

describe("composeTestRoutingResult: the owner (R301)", () => {
    it("shows the person a rule chose, with the rules after it not evaluated", () => {
        const result = composeTestRoutingResult(
            inspection({
                owner: { id: "user-iv", displayName: "Ivan Horvat" },
                source: "rule",
                ruleId: "r1",
                trace: [
                    { ruleId: "r1", outcome: "matched", reason: null, failedConditions: [] },
                    { ruleId: "r2", outcome: "notEvaluated", reason: null, failedConditions: [] },
                    { ruleId: "r3", outcome: "notEvaluated", reason: null, failedConditions: [] }
                ]
            }),
            context()
        );

        expect(result.ownerLabel).toBe("Ivan Horvat");
        expect(result.ownerIcon).toBe("person");
        expect(result.reason).toBe("Assigned by rule 1");
        expect(result.strategyLine).toBe("Not used: a rule chose the reviewer.");
        expect(result.trace).toEqual([
            {
                ruleId: "r1",
                tag: "Matched",
                label: "Rule 1: If requester is in Marketing → Ivan Horvat",
                reason: "All conditions match."
            },
            {
                ruleId: "r2",
                tag: "Skipped",
                label: "Rule 2: If content is in /Campaigns (incl. subfolders) → Legal team pool",
                reason: "An earlier rule matched."
            },
            {
                ruleId: "r3",
                tag: "Skipped",
                label: "Rule 3: If requester is Ivan Horvat and requester is in Marketing and content is in /Campaigns (incl. subfolders) → Legal team pool",
                reason: "An earlier rule matched."
            }
        ]);
    });

    it("shows the team pool when no rule matched and the strategy is none", () => {
        const result = composeTestRoutingResult(inspection(), context());

        expect(result.ownerLabel).toBe("Team pool");
        expect(result.ownerIcon).toBe("groups");
        expect(result.reason).toBe("No rule matched; waits in the team pool.");
        expect(result.strategyLine).toBe("None: the step waits in the team pool.");
        expect(result.trace).toEqual([]);
        expect(result.skipped).toEqual([]);
    });

    it("names the team in the no-rule sentence when the step has exactly one reviewing team", () => {
        const one = composeTestRoutingResult(
            inspection(),
            context({ stepTeamIds: ["team-l"] })
        );
        const two = composeTestRoutingResult(
            inspection(),
            context({ stepTeamIds: ["team-l", "team-m"] })
        );

        expect(one.reason).toBe("No rule matched; waits in the Legal team pool.");
        expect(two.reason).toBe("No rule matched; waits in the team pool.");
    });

    it("says which rule sent it to which team pool for a matched team rule with strategy none", () => {
        const result = composeTestRoutingResult(
            inspection({
                ruleId: "r2",
                narrowedTeamId: "team-l",
                trace: [
                    { ruleId: "r1", outcome: "notMatched", reason: null, failedConditions: [] },
                    { ruleId: "r2", outcome: "matched", reason: null, failedConditions: [] }
                ]
            }),
            context({ names: names({}, { "team-l": "Legal" }) })
        );

        expect(result.ownerLabel).toBe("Team pool");
        expect(result.reason).toBe("Rule 2 sent it to the Legal team pool.");
        expect(result.strategyLine).toBe("None: the step waits in the team pool.");
    });

    it("takes the narrowed team's name from the references when the names have none, and never throws for an unknown team", () => {
        const fromReferences = composeTestRoutingResult(
            inspection({ ruleId: "r2", narrowedTeamId: "team-l" }),
            context()
        );
        const unknown = composeTestRoutingResult(
            inspection({ ruleId: "r2", narrowedTeamId: "team-x" }),
            context()
        );

        expect(fromReferences.reason).toBe("Rule 2 sent it to the Legal team pool.");
        expect(unknown.reason).toContain("Deleted team");
    });

    it("falls back to Assigned by rule when a rule sent it to the pool without a narrowed team", () => {
        const result = composeTestRoutingResult(inspection({ ruleId: "r2" }), context());

        expect(result.reason).toBe("Assigned by rule 2");
    });

    it("treats a rule id that is in neither the rules nor the trace as no rule", () => {
        const result = composeTestRoutingResult(inspection({ ruleId: "gone" }), context());

        expect(result.reason).toBe("No rule matched; waits in the team pool.");
    });

    it("says Round-robin chose the person when no rule narrowed it", () => {
        const result = composeTestRoutingResult(
            inspection({
                owner: { id: "user-a", displayName: "Ana" },
                source: "roundRobin",
                strategy: "roundRobin",
                candidateIds: ["user-a", "user-b"],
                candidateCount: 2
            }),
            context({ strategy: "roundRobin", names: names({ "user-a": "Ana", "user-b": "Bob" }) })
        );

        expect(result.ownerLabel).toBe("Ana");
        expect(result.reason).toBe("Round-robin chose Ana.");
        expect(result.strategyLine).toBe("Round-robin across Ana, Bob: Ana is next in rotation.");
    });

    it("says which rule narrowed it to which team, for round-robin and least-loaded", () => {
        const base = inspection({
            owner: { id: "user-a", displayName: "Ana" },
            ruleId: "r2",
            narrowedTeamId: "team-l",
            candidateIds: ["user-a"],
            candidateCount: 1
        });
        const withNames = names({ "user-a": "Ana" }, { "team-l": "Legal" });

        const roundRobin = composeTestRoutingResult(
            { ...base, source: "roundRobin", strategy: "roundRobin" },
            context({ strategy: "roundRobin", names: withNames })
        );
        const leastLoaded = composeTestRoutingResult(
            { ...base, source: "leastLoaded", strategy: "leastLoaded" },
            context({ strategy: "leastLoaded", names: withNames })
        );

        expect(roundRobin.reason).toBe(
            "Rule 2 narrowed it to the Legal team; round-robin chose Ana."
        );
        expect(leastLoaded.reason).toBe(
            "Rule 2 narrowed it to the Legal team; least-loaded chose Ana."
        );
    });

    it("says Least-loaded chose the person and why", () => {
        const result = composeTestRoutingResult(
            inspection({
                owner: { id: "user-a", displayName: "Ana" },
                source: "leastLoaded",
                strategy: "leastLoaded",
                candidateIds: ["user-a", "user-b"],
                candidateCount: 2
            }),
            context({ strategy: "leastLoaded" })
        );

        expect(result.reason).toBe("Least-loaded chose Ana.");
        expect(result.strategyLine).toBe("Least-loaded chose Ana: fewest open reviews.");
    });

    it("sends it to the pool when every candidate was skipped, for both strategies", () => {
        const roundRobin = composeTestRoutingResult(
            inspection({ strategy: "roundRobin" }),
            context({ strategy: "roundRobin" })
        );
        const leastLoaded = composeTestRoutingResult(
            inspection({ strategy: "leastLoaded", ruleId: "r2", narrowedTeamId: "team-l" }),
            context({ strategy: "leastLoaded" })
        );

        expect(roundRobin.ownerLabel).toBe("Team pool");
        expect(roundRobin.reason).toBe("Sent to team pool: all candidates were skipped.");
        expect(roundRobin.strategyLine).toBe("Round-robin: no eligible candidate.");
        expect(leastLoaded.reason).toBe("Sent to team pool: all candidates were skipped.");
        expect(leastLoaded.strategyLine).toBe("Least-loaded: no eligible candidate.");
    });
});

describe("composeTestRoutingResult: the round-robin candidates (R289, R301)", () => {
    const roundRobin = (overrides: Partial<RoutingInspection>): RoutingInspection => {
        return inspection({
            owner: { id: "user-a", displayName: "Ana" },
            source: "roundRobin",
            strategy: "roundRobin",
            ...overrides
        });
    };

    it("names up to three candidates and says and others when there are more", () => {
        const result = composeTestRoutingResult(
            roundRobin({ candidateIds: ["user-a", "user-b", "user-c"], candidateCount: 5 }),
            context({ names: names({ "user-a": "Ana", "user-b": "Bob", "user-c": "Cy" }) })
        );

        expect(result.strategyLine).toBe(
            "Round-robin across Ana, Bob, Cy and others: Ana is next in rotation."
        );
    });

    it("does not say and others when every candidate is named", () => {
        const result = composeTestRoutingResult(
            roundRobin({ candidateIds: ["user-a", "user-b", "user-c"], candidateCount: 3 }),
            context({ names: names({ "user-a": "Ana", "user-b": "Bob", "user-c": "Cy" }) })
        );

        expect(result.strategyLine).toBe(
            "Round-robin across Ana, Bob, Cy: Ana is next in rotation."
        );
    });

    it("names the owner from the inspection and an unnamed candidate Deleted user", () => {
        const result = composeTestRoutingResult(
            roundRobin({ candidateIds: ["user-a", "user-gone"], candidateCount: 2 }),
            context()
        );

        expect(result.strategyLine).toBe(
            "Round-robin across Ana, Deleted user: Ana is next in rotation."
        );
    });

    it("takes a candidate's name from the references when the names have none", () => {
        const references: RuleReferences = createRuleReferences({
            users: [createReferenceLabel({ id: "user-b", label: "Bob" })]
        });

        const result = composeTestRoutingResult(
            roundRobin({ candidateIds: ["user-a", "user-b"], candidateCount: 2 }),
            context({ references })
        );

        expect(result.strategyLine).toBe("Round-robin across Ana, Bob: Ana is next in rotation.");
    });
});

describe("composeTestRoutingResult: the trace rows (R301)", () => {
    it("names every failed condition, joined with and and capitalised", () => {
        const result = composeTestRoutingResult(
            inspection({
                trace: [notMatched("r3", ["requesterUser", "requesterTeam", "folder"])]
            }),
            context()
        );

        expect(result.trace[0].tag).toBe("Not matched");
        expect(result.trace[0].label).toBe(
            "Rule 3: If requester is Ivan Horvat and requester is in Marketing and content is in /Campaigns (incl. subfolders) → Legal team pool"
        );
        expect(result.trace[0].reason).toBe(
            "Requester is not Ivan Horvat and requester is not in Marketing and content is not in /Campaigns or its subfolders."
        );
    });

    it("names a single failed condition", () => {
        const result = composeTestRoutingResult(
            inspection({ trace: [notMatched("r1", ["requesterTeam"])] }),
            context()
        );

        expect(result.trace[0].reason).toBe("Requester is not in Marketing.");
    });

    it("says or its subfolders only for a folder that includes them", () => {
        const result = composeTestRoutingResult(
            inspection({ trace: [notMatched("r2", ["folder"]), notMatched("r4", ["folder"])] }),
            context()
        );

        expect(result.trace[0].reason).toBe("Content is not in /Campaigns or its subfolders.");
        expect(result.trace[1].reason).toBe("Content is not in /Campaigns.");
    });

    it("says the restricted folder for a folder the admin cannot see", () => {
        const references = createRuleReferences({
            folders: [
                createReferenceLabel({ id: "f1", label: "Restricted folder", state: "restricted" })
            ]
        });

        const result = composeTestRoutingResult(
            inspection({ trace: [notMatched("r2", ["folder"])] }),
            context({ references })
        );

        expect(result.trace[0].reason).toBe("Content is not in the restricted folder or its subfolders.");
    });

    it("uses the server reason when no condition is named, and the fallback when it has none either", () => {
        const withReason = composeTestRoutingResult(
            inspection({ trace: [notMatched("r1", [], "The server says so.")] }),
            context()
        );
        const withoutReason = composeTestRoutingResult(
            inspection({ trace: [notMatched("r1", [])] }),
            context()
        );

        expect(withReason.trace[0].reason).toBe("The server says so.");
        expect(withoutReason.trace[0].reason).toBe("A condition on this rule does not match.");
    });

    it("says All conditions match for a matched row without a reason and keeps a server reason", () => {
        const result = composeTestRoutingResult(
            inspection({
                trace: [
                    { ruleId: "r1", outcome: "matched", reason: null, failedConditions: [] },
                    { ruleId: "r2", outcome: "matched", reason: "Matched anyway.", failedConditions: [] }
                ]
            }),
            context()
        );

        expect(result.trace.map(row => row.reason)).toEqual([
            "All conditions match.",
            "Matched anyway."
        ]);
    });

    it("shows the server's reason of a skipped row verbatim and the fallback for a null reason", () => {
        const result = composeTestRoutingResult(
            inspection({
                trace: [
                    {
                        ruleId: "r1",
                        outcome: "skipped",
                        reason: "Not a member of the step's teams.",
                        failedConditions: []
                    },
                    { ruleId: "r2", outcome: "skipped", reason: null, failedConditions: [] }
                ]
            }),
            context()
        );

        expect(result.trace[0].tag).toBe("Skipped");
        expect(result.trace[0].reason).toBe("Not a member of the step's teams.");
        expect(result.trace[1].tag).toBe("Skipped");
        expect(result.trace[1].reason).toBe("A condition on this rule does not match.");
    });

    it("renders a trace entry whose rule is not among the rules as Rule with its position and does not throw", () => {
        const result = composeTestRoutingResult(
            inspection({
                trace: [
                    { ruleId: "r1", outcome: "matched", reason: null, failedConditions: [] },
                    notMatched("gone", ["folder"], "Server reason.")
                ]
            }),
            context()
        );

        expect(result.trace[1]).toEqual({
            ruleId: "gone",
            tag: "Not matched",
            label: "Rule 2",
            reason: "Server reason."
        });
    });

    it("numbers the rows by the rules of the request, so a stale result keeps its numbering", () => {
        const reordered = [RULES[1], RULES[0]];

        const result = composeTestRoutingResult(
            inspection({
                trace: [
                    { ruleId: "r1", outcome: "matched", reason: null, failedConditions: [] }
                ]
            }),
            context({ rules: reordered })
        );

        expect(result.trace[0].label.startsWith("Rule 2: ")).toBe(true);
    });
});

describe("composeTestRoutingResult: the skipped people (R301, copy gap 4)", () => {
    it("shows the server's reason verbatim with the server's name, the resolved name or Deleted user", () => {
        const result = composeTestRoutingResult(
            inspection({
                skipped: [
                    { userId: "user-a", displayName: "Ana", reason: "The requester cannot review." },
                    {
                        userId: "user-b",
                        displayName: null,
                        reason: "Not a member of the step's teams."
                    },
                    { userId: "user-gone", displayName: null, reason: "Cannot read this content." }
                ]
            }),
            context({ names: names({ "user-b": "Bob" }) })
        );

        expect(result.skipped).toEqual([
            { name: "Ana", reason: "The requester cannot review." },
            { name: "Bob", reason: "Not a member of the step's teams." },
            { name: "Deleted user", reason: "Cannot read this content." }
        ]);
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/model/testRouting/getTestRoutingSignature.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/testRouting/composeTestRoutingResult.test.ts 2>&1 | tail -30
```

Expected: both fail with `Failed to resolve import` for `./getTestRoutingSignature.js`, `./composeTestRoutingResult.js`, `./TestRoutingInput.js` or `./TestRoutingContext.js`. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/model/testRouting/TestRoutingInput.ts`:

```ts
import type { AssignmentStrategy } from "~/editor/model/assignment/AssignmentStrategy.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";

/*
 * Everything a Test routing result depends on (R300): the step's teams, strategy, pick toggle and
 * rules, and the test's requester and folder. Nothing else about the step belongs here, so nothing
 * else can make a result stale. `strategy` is `null` for an unknown stored strategy (R314).
 */
export interface TestRoutingInput {
    stepId: string;
    teams: string[];
    strategy: AssignmentStrategy | null;
    allowManualPick: boolean;
    rules: RuleValue[];
    requesterId: string | null;
    folderId: string | null;
}
```

Create `packages/app-workflows/src/editor/model/testRouting/TestRoutingResultVm.ts`:

```ts
export type TestRoutingTag = "Matched" | "Not matched" | "Skipped";

export interface TestRoutingRowVm {
    ruleId: string;
    tag: TestRoutingTag;
    // `Rule {n}: {summary}`, or `Rule {n}` when the rule is not among the rules of the request.
    label: string;
    reason: string;
}

export interface TestRoutingSkippedVm {
    name: string;
    reason: string;
}

// The render-ready Test routing result (R234, R301): sentences, no ids to resolve.
export interface TestRoutingResultVm {
    // The person's name, or `Team pool`.
    ownerLabel: string;
    ownerIcon: "person" | "groups";
    reason: string;
    trace: TestRoutingRowVm[];
    strategyLine: string;
    skipped: TestRoutingSkippedVm[];
}
```

Create `packages/app-workflows/src/editor/model/testRouting/TestRoutingContext.ts`:

```ts
import type { AssignmentStrategy } from "~/editor/model/assignment/AssignmentStrategy.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";

// The names the editor looked up for the ids of an inspection (Task 14c): users by id, teams by id.
export interface InspectionNames {
    users: ReadonlyMap<string, string>;
    teams: ReadonlyMap<string, string>;
}

/*
 * What the composer needs besides the inspection. `rules` are the rules of the request the
 * inspection answers, never the current ones, so a stale result keeps its numbering (R300).
 * `strategy` is the request's strategy; the sentences use the server's own `inspection.strategy`.
 */
export interface TestRoutingContext {
    rules: RuleValue[];
    strategy: AssignmentStrategy | null;
    references: RuleReferences;
    names: InspectionNames;
    // The step's reviewing teams. Optional: with exactly one the pool sentence names it (`No rule matched; waits in the {Team} team pool.`), otherwise it is the plain `team pool` variant.
    stepTeamIds?: string[];
}
```

Create `packages/app-workflows/src/editor/model/testRouting/getTestRoutingSignature.ts`:

```ts
import type { TestRoutingInput } from "./TestRoutingInput.js";

/*
 * The design prototype's signature (R300): a result is out of date when this string of the
 * current input differs from the one taken when the request was sent.
 */
export const getTestRoutingSignature = (input: TestRoutingInput): string => {
    return JSON.stringify([
        input.stepId,
        input.teams,
        input.strategy,
        input.allowManualPick,
        input.rules,
        input.requesterId,
        input.folderId
    ]);
};
```

Create `packages/app-workflows/src/editor/model/testRouting/getInspectionUserName.ts`:

```ts
import type { TestRoutingContext } from "./TestRoutingContext.js";

const DELETED_USER = "Deleted user";

/*
 * A user's name for the Test routing prose: the looked-up name, then the label of the reference
 * maps, then `Deleted user` (R301). Never throws.
 */
export const getInspectionUserName = (userId: string, context: TestRoutingContext): string => {
    const looked = context.names.users.get(userId);
    if (looked !== undefined) {
        return looked;
    }
    const reference = context.references.users.get(userId);
    if (reference !== undefined) {
        return reference.label;
    }
    return DELETED_USER;
};
```

Create `packages/app-workflows/src/editor/model/testRouting/getInspectionTeamName.ts`:

```ts
import type { TestRoutingContext } from "./TestRoutingContext.js";

const DELETED_TEAM = "Deleted team";

// A team's name for the Test routing prose: the looked-up name, then the reference label, then `Deleted team`.
export const getInspectionTeamName = (teamId: string, context: TestRoutingContext): string => {
    const looked = context.names.teams.get(teamId);
    if (looked !== undefined) {
        return looked;
    }
    const reference = context.references.teams.get(teamId);
    if (reference !== undefined) {
        return reference.label;
    }
    return DELETED_TEAM;
};
```

Create `packages/app-workflows/src/editor/model/testRouting/getRulePosition.ts`:

```ts
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";

/*
 * The 1-based number of a rule: its position in the rules of the request, else its position in the
 * inspection's trace; `null` when the id is in neither.
 */
export const getRulePosition = (
    ruleId: string,
    inspection: RoutingInspection,
    rules: RuleValue[]
): number | null => {
    const ruleIndex = rules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex !== -1) {
        return ruleIndex + 1;
    }
    const traceIndex = inspection.trace.findIndex(entry => entry.ruleId === ruleId);
    if (traceIndex !== -1) {
        return traceIndex + 1;
    }
    return null;
};
```

Create `packages/app-workflows/src/editor/model/testRouting/describeFailedConditions.ts`:

```ts
import type { RoutingCondition } from "~/editor/domain/types.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import type { ReferenceLabel } from "~/editor/model/rules/ReferenceLabel.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";

const UNKNOWN_ITEM = "Unknown item";

function getLabel(map: ReadonlyMap<string, ReferenceLabel>, id: string): string {
    const reference = map.get(id);
    return reference === undefined ? UNKNOWN_ITEM : reference.label;
}

function describeFolderCondition(rule: RuleValue, references: RuleReferences): string | null {
    if (rule.folder === null) {
        return null;
    }
    const reference = references.folders.get(rule.folder.id);
    let path = UNKNOWN_ITEM;
    if (reference !== undefined) {
        path = reference.label;
    }
    if (reference !== undefined && reference.state === "restricted") {
        path = "the restricted folder";
    }
    const subfolders = rule.folder.includeDescendants ? " or its subfolders" : "";

    return `content is not in ${path}${subfolders}`;
}

function describeCondition(
    condition: RoutingCondition,
    rule: RuleValue,
    references: RuleReferences
): string | null {
    if (condition === "requesterUser" && rule.requesterUserId !== null) {
        const name = getLabel(references.users, rule.requesterUserId);
        return `requester is not ${name}`;
    }
    if (condition === "requesterTeam" && rule.requesterTeamId !== null) {
        const name = getLabel(references.teams, rule.requesterTeamId);
        return `requester is not in ${name}`;
    }
    if (condition === "folder") {
        return describeFolderCondition(rule, references);
    }
    return null;
}

/*
 * The failed conditions of a not matched rule as one capitalised sentence (R301): `Requester is not
 * Ivan Horvat and content is not in /Campaigns or its subfolders.` Empty when no named condition
 * can be described (none failed, or the rule has no such condition).
 */
export const describeFailedConditions = (
    failed: RoutingCondition[],
    rule: RuleValue,
    references: RuleReferences
): string => {
    const parts: string[] = [];
    for (const condition of failed) {
        const part = describeCondition(condition, rule, references);
        if (part !== null) {
            parts.push(part);
        }
    }
    if (parts.length === 0) {
        return "";
    }

    const sentence = parts.join(" and ");
    return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
};
```

Create `packages/app-workflows/src/editor/model/testRouting/composeTraceRows.ts`:

```ts
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { RoutingTraceEntry } from "~/editor/domain/types.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import { describeRule } from "~/editor/model/rules/describeRule.js";
import { describeFailedConditions } from "./describeFailedConditions.js";
import type { TestRoutingContext } from "./TestRoutingContext.js";
import type { TestRoutingRowVm } from "./TestRoutingResultVm.js";
import type { TestRoutingTag } from "./TestRoutingResultVm.js";

const ALL_MATCH = "All conditions match.";
const EARLIER_RULE = "An earlier rule matched.";
// Copy gap 10: a row with no named condition and no server reason.
const UNNAMED_CONDITION = "A condition on this rule does not match.";

function getTag(entry: RoutingTraceEntry): TestRoutingTag {
    if (entry.outcome === "matched") {
        return "Matched";
    }
    if (entry.outcome === "notMatched") {
        return "Not matched";
    }
    return "Skipped";
}

function getReason(
    entry: RoutingTraceEntry,
    rule: RuleValue | null,
    context: TestRoutingContext
): string {
    if (entry.outcome === "notEvaluated") {
        return EARLIER_RULE;
    }
    if (entry.outcome === "matched") {
        return entry.reason === null ? ALL_MATCH : entry.reason;
    }
    if (entry.outcome === "notMatched" && rule !== null) {
        const named = describeFailedConditions(entry.failedConditions, rule, context.references);
        if (named !== "") {
            return named;
        }
    }
    return entry.reason === null ? UNNAMED_CONDITION : entry.reason;
}

function composeRow(
    entry: RoutingTraceEntry,
    index: number,
    context: TestRoutingContext
): TestRoutingRowVm {
    const ruleIndex = context.rules.findIndex(item => item.id === entry.ruleId);
    const rule = ruleIndex === -1 ? null : context.rules[ruleIndex];
    const position = ruleIndex === -1 ? index + 1 : ruleIndex + 1;

    let label = `Rule ${position}`;
    if (rule !== null) {
        const summary = describeRule(rule, context.references);
        label = `Rule ${position}: ${summary}`;
    }

    return {
        ruleId: entry.ruleId,
        tag: getTag(entry),
        label,
        reason: getReason(entry, rule, context)
    };
}

// One row per rule of the inspection's trace, in the server's order (R289, R301).
export const composeTraceRows = (
    inspection: RoutingInspection,
    context: TestRoutingContext
): TestRoutingRowVm[] => {
    return inspection.trace.map((entry, index) => composeRow(entry, index, context));
};
```

Create `packages/app-workflows/src/editor/model/testRouting/composeReasonLine.ts`:

```ts
import type { RoutingInspection } from "~/editor/domain/types.js";
import { getInspectionTeamName } from "./getInspectionTeamName.js";
import { getRulePosition } from "./getRulePosition.js";
import type { TestRoutingContext } from "./TestRoutingContext.js";

const NO_RULE_POOL = "No rule matched; waits in the team pool.";
const ALL_SKIPPED = "Sent to team pool: all candidates were skipped.";

// The design names the team when the step has exactly one reviewing team.
function composeNoRuleReason(context: TestRoutingContext): string {
    const teamIds = context.stepTeamIds;
    if (teamIds === undefined || teamIds.length !== 1) {
        return NO_RULE_POOL;
    }
    const team = getInspectionTeamName(teamIds[0], context);

    return `No rule matched; waits in the ${team} team pool.`;
}

function composeStrategyChoice(
    inspection: RoutingInspection,
    ownerName: string,
    position: number | null,
    context: TestRoutingContext
): string {
    const verb = inspection.source === "roundRobin" ? "round-robin" : "least-loaded";
    const sentence = `${verb.charAt(0).toUpperCase()}${verb.slice(1)} chose ${ownerName}.`;
    if (inspection.narrowedTeamId === null || position === null) {
        return sentence;
    }
    const team = getInspectionTeamName(inspection.narrowedTeamId, context);

    return `Rule ${position} narrowed it to the ${team} team; ${verb} chose ${ownerName}.`;
}

function composePoolReason(
    inspection: RoutingInspection,
    position: number | null,
    context: TestRoutingContext
): string {
    if (inspection.strategy !== "none") {
        return ALL_SKIPPED;
    }
    if (position === null) {
        return composeNoRuleReason(context);
    }
    if (inspection.narrowedTeamId === null) {
        return `Assigned by rule ${position}`;
    }
    const team = getInspectionTeamName(inspection.narrowedTeamId, context);

    return `Rule ${position} sent it to the ${team} team pool.`;
}

/*
 * The owner's reason line (R301). `position` is the rule's number; a rule id that is in neither
 * the rules nor the trace counts as no rule.
 */
export const composeReasonLine = (
    inspection: RoutingInspection,
    context: TestRoutingContext
): string => {
    let position: number | null = null;
    if (inspection.ruleId !== null) {
        position = getRulePosition(inspection.ruleId, inspection, context.rules);
    }

    const owner = inspection.owner;
    if (owner === null) {
        return composePoolReason(inspection, position, context);
    }
    if (inspection.source === "roundRobin" || inspection.source === "leastLoaded") {
        return composeStrategyChoice(inspection, owner.displayName, position, context);
    }
    if (position !== null) {
        return `Assigned by rule ${position}`;
    }
    return "";
};
```

Create `packages/app-workflows/src/editor/model/testRouting/composeStrategyLine.ts`:

```ts
import type { RoutingInspection } from "~/editor/domain/types.js";
import { getInspectionUserName } from "./getInspectionUserName.js";
import type { TestRoutingContext } from "./TestRoutingContext.js";

const NOT_USED = "Not used: a rule chose the reviewer.";
const NONE = "None: the step waits in the team pool.";

function composeRotation(
    inspection: RoutingInspection,
    ownerId: string,
    ownerName: string,
    context: TestRoutingContext
): string {
    const names = inspection.candidateIds.map(id => {
        if (id === ownerId) {
            return ownerName;
        }
        return getInspectionUserName(id, context);
    });
    if (names.length === 0) {
        names.push(ownerName);
    }
    let others = "";
    if (inspection.candidateCount > inspection.candidateIds.length) {
        others = " and others";
    }

    return `Round-robin across ${names.join(", ")}${others}: ${ownerName} is next in rotation.`;
}

/*
 * The strategy row of the result (R301): not used when a rule chose the reviewer, the strategy's
 * own sentence otherwise.
 */
export const composeStrategyLine = (
    inspection: RoutingInspection,
    context: TestRoutingContext
): string => {
    if (inspection.source === "rule") {
        return NOT_USED;
    }
    if (inspection.strategy === "none") {
        return NONE;
    }

    const owner = inspection.owner;
    if (owner === null) {
        const name = inspection.strategy === "roundRobin" ? "Round-robin" : "Least-loaded";
        return `${name}: no eligible candidate.`;
    }
    if (inspection.strategy === "leastLoaded") {
        return `Least-loaded chose ${owner.displayName}: fewest open reviews.`;
    }

    return composeRotation(inspection, owner.id, owner.displayName, context);
};
```

Create `packages/app-workflows/src/editor/model/testRouting/composeSkippedPeople.ts`:

```ts
import type { RoutingInspection } from "~/editor/domain/types.js";
import { getInspectionUserName } from "./getInspectionUserName.js";
import type { TestRoutingContext } from "./TestRoutingContext.js";
import type { TestRoutingSkippedVm } from "./TestRoutingResultVm.js";

// The people routing skipped, with the server's reason verbatim (R301, copy gap 4 for the name).
export const composeSkippedPeople = (
    inspection: RoutingInspection,
    context: TestRoutingContext
): TestRoutingSkippedVm[] => {
    return inspection.skipped.map(person => {
        let name = getInspectionUserName(person.userId, context);
        if (person.displayName !== null) {
            name = person.displayName;
        }

        return { name, reason: person.reason };
    });
};
```

Create `packages/app-workflows/src/editor/model/testRouting/composeTestRoutingResult.ts`:

```ts
import type { RoutingInspection } from "~/editor/domain/types.js";
import { composeReasonLine } from "./composeReasonLine.js";
import { composeSkippedPeople } from "./composeSkippedPeople.js";
import { composeStrategyLine } from "./composeStrategyLine.js";
import { composeTraceRows } from "./composeTraceRows.js";
import type { TestRoutingContext } from "./TestRoutingContext.js";
import type { TestRoutingResultVm } from "./TestRoutingResultVm.js";

const TEAM_POOL = "Team pool";

/*
 * The Test routing result as the design words it (R301), composed from the server's inspection,
 * the rules of the request and the resolved names. Pure; every sentence comes from data.
 */
export const composeTestRoutingResult = (
    inspection: RoutingInspection,
    context: TestRoutingContext
): TestRoutingResultVm => {
    const owner = inspection.owner;
    const ownerLabel = owner === null ? TEAM_POOL : owner.displayName;
    const ownerIcon: TestRoutingResultVm["ownerIcon"] = owner === null ? "groups" : "person";

    return {
        ownerLabel,
        ownerIcon,
        reason: composeReasonLine(inspection, context),
        trace: composeTraceRows(inspection, context),
        strategyLine: composeStrategyLine(inspection, context),
        skipped: composeSkippedPeople(inspection, context)
    };
};
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/model/testRouting/getTestRoutingSignature.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/testRouting/composeTestRoutingResult.test.ts 2>&1 | tail -40
```

Expected: PASS. If a case fails on a type error at the inspection literals, check the union values Task 7 gave `RoutingTraceOutcome`, `RoutingCondition` and `RoutingSource` against the list under Interfaces.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

Nothing existing changed in this task.

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
git commit -m "feat(app-workflows): compose the Test routing result and its signature" -m "composeTestRoutingResult words the server's routing inspection as the design does: the owner and why, a row for every rule with its failed conditions, the strategy line and the skipped people with the server's reasons verbatim. getTestRoutingSignature is what makes a result out of date." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`TestRoutingInput.strategy` and `TestRoutingContext.strategy` are `AssignmentStrategy | null`** (the contract says `AssignmentStrategy`), because Task 9 widens the typed strategy to `null` for an unknown stored value (R314). The composer's sentences use the server's `inspection.strategy` (always one of the three); `context.strategy` stays in the contract's shape for the presenter to pass.
- **`InspectionNames` lives in `TestRoutingContext.ts`** (the contract lists no file for it). Task 14c imports it from `~/editor/model/testRouting/TestRoutingContext.js`.
- **Reason line and the step's teams.** The design words the pool case `No rule matched; waits in the {Team} team pool.` with the team name when the step has one reviewing team (R301 lists both variants). The contract's `TestRoutingContext` carries no step teams, so `TestRoutingContext` gains the optional `stepTeamIds?: string[]`: with exactly one id the sentence names that team, otherwise (absent, empty, several) it reads `No rule matched; waits in the team pool.` Task 17 should pass `stepTeamIds: input.teams`; a caller that does not keeps the plain variant. The matched team rule case names the narrowed team, which the server returns.
- **Deleted references in a failed condition read as their label** (`Requester is not Deleted user.`, `Content is not in Deleted folder.`): R301 fixes only the restricted folder text (`the restricted folder`) and has no sentence for the deleted ones.
- **Unsourced edge:** a done inspection with an owner and a source other than `rule`, `roundRobin` or `leastLoaded` (the inspector never returns `picked` or an owner with source `pool`) gets `Assigned by rule {n}` with a rule and an empty reason without one.
- **Extra files** (the contract lists five): `getInspectionUserName.ts`, `getInspectionTeamName.ts`, `getRulePosition.ts`, `describeFailedConditions.ts`, `composeTraceRows.ts`, `composeReasonLine.ts`, `composeStrategyLine.ts`, `composeSkippedPeople.ts`, one function each (composition steps get their own file).

## Review fixes (sub-phase review)

- Removed `yarn check:test:types -p app-workflows` from Step 5 (8a R243).
- R301's `No rule matched; waits in the {Team} team pool.` sentence was missing: added the optional `stepTeamIds?: string[]` to `TestRoutingContext`, `composeNoRuleReason` in `composeReasonLine.ts` and a test (one team names it, two teams do not). Cross-sub-phase: Task 17 passes `stepTeamIds`.
- Named the nested calls in the `getTestRoutingSignature` tests.
- Checked against Task 7 of 9b.3: `RoutingInspection`, `RoutingTraceEntry`, `RoutingSkippedPerson`, `RoutingOwner`, `RoutingCondition`, `RoutingTraceOutcome` and `RoutingSource` values and fields match; every R301 sentence, the copy gap 4, 5 and 10 strings and the `Skipped` tag for `notEvaluated` are covered by a test.
