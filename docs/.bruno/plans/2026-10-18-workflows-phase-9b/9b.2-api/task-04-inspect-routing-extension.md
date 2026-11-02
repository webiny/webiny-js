### Task 4: `inspectRouting` extension

R289, D172, Q55; Review Focus 7 (`00-shared.md`). The phase 9b Global Constraints and the 9a, 8b and 8a ones they inherit apply unchanged (read: R87/D132 never throw out of a dependency, internal engine use cases check no permission, no helper wrappers around dependency calls, one class or one public function per file, one named import per line, namespace types, comments end with a period, no nested call arguments, no multiline ternaries, no inline conditional spreads, targeted tests, the pre-commit chain, SEC ids never in code or commits).

The inspector answers for every rule so the editor can compose the Test routing sentences from data. Live assignment (step reach) must not change: the evaluator stays lazy and its lookups, outcomes and records are the same. Everything new is produced only when the new `explain` flag is set, which only `InspectRoutingUseCase` sets.

- **Inspector mode** (`RoutingEvaluateParams.explain`, optional, absent is false). With it the evaluator (1) evaluates every condition of every rule up to the deciding one, reading the requester's teams and the folder chain even for a rule that already failed a local condition, so `failedConditions` is complete; (2) keeps walking the rules after the deciding one and marks each `notEvaluated` (reason `null`, no failed conditions) without assigning, reading anything or checking read access; (3) returns the strategy's order of the eligible candidates (`strategyOrder`). The chain is read only when the rule's folder condition has the target folder's type (another type can never match, and the existing local check already decides it), which is also the only case live evaluation reads it, so the lookup count of a live evaluation is identical.
- **Trace.** `RoutingTraceOutcome` gains `notEvaluated`. `RoutingTraceEntry.failedConditions?: RoutingCondition[]` is set on `notMatched` entries in inspector mode only; `RoutingCondition = "requesterUser" | "requesterTeam" | "folder"`, in that order when several fail. A failed `modelId` condition makes the rule `notMatched` and adds nothing. A rule whose target is invalid (`skipped`) does not stop the walk. `RoutingInspection.trace` is `RoutingInspectionTraceEntry[]`, whose `failedConditions` is always an array (`[]` unless `notMatched` with named conditions).
- **Inspection fields.** `narrowedTeamId: string | null` (the team a matched team-target rule narrowed to: found from `ruleId` in the step's rules, null when the deciding rule is a user target or none decided), `candidateIds: string[]` (the first `INSPECTION_CANDIDATE_LIMIT` = 3 ids of the strategy order; empty when a rule chose the owner, the strategy is `none` or nobody is eligible) and `candidateCount: number` (the length of the whole order, so the editor can say `and others`). The order is the strategy's own before read access is checked, so a candidate who cannot read is still listed (and appears in `skipped`). No per-person load numbers (D104).
- **GraphQL** (`[AWF]/graphql/WorkflowsSchemaFactory.ts`): `WorkflowsRoutingTraceOutcome` gains `notEvaluated`; `enum WorkflowsRoutingCondition { requesterUser requesterTeam folder }`; `WorkflowsRoutingTraceEntry.failedConditions: [WorkflowsRoutingCondition!]!`; `WorkflowsRoutingInspection` gains `narrowedTeamId: ID`, `candidateIds: [ID!]!`, `candidateCount: Int!`, each appended after the existing fields. The CMS and WB schema factories reuse the shared type (`data: WorkflowsRoutingInspection`) and their wrappers pass the inspection through unchanged, so no source changes there; their tests change.

**Files:**
- Modify: `packages/api-workflows/src/constants.ts`
- Modify: `packages/api-workflows/src/domain/routing/types.ts`
- Create: `packages/api-workflows/src/domain/routing/getFailedRoutingConditions.ts`
- Create: `packages/api-workflows/src/domain/routing/listNotEvaluatedTrace.ts`
- Modify: `packages/api-workflows/src/domain/routing/toRoutingEvaluation.ts` (replaced in full)
- Modify: `packages/api-workflows/src/features/routing/RoutingEvaluatorService/RoutingEvaluatorService.ts`
- Modify: `packages/api-workflows/src/features/routing/InspectRouting/InspectRoutingUseCase.ts` (replaced in full; includes the Task 3 edits)
- Modify: `packages/api-workflows/src/features/routing/InspectRouting/index.ts`
- Modify: `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`
- Create: `packages/api-workflows/__tests__/routing/getFailedRoutingConditions.test.ts`
- Modify: `packages/api-workflows/__tests__/routing/RoutingEvaluatorService.test.ts`
- Modify: `packages/api-workflows/__tests__/routing/InspectRouting.test.ts`
- Modify: `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/graphql/cmsRoutingSchema.test.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/wrappers/routingWrappers.test.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/__helpers/graphql.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/graphql/pageRouting.test.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/wrappers/routingWrappers.test.ts`

**Interfaces:**
- Consumes (verified with codegraph and the source): `RoutingEvaluatorService.evaluate` (`~/features/routing/RoutingEvaluatorService/index.js`; the only callers are `RoutingStepAssignmentResolver` and `InspectRoutingUseCase`), `matchRoutingRuleConditions` and `matchRoutingRuleLocalConditions` (`~/domain/routing/`), `RoutingRuleFacts`, `RoutingRuleLocalFacts`, `RoutingUser`, `RoutingTraceEntry`, `RoutingInspection` (`~/domain/routing/types.js`), `RoutingRule`, `RoutingRuleConditions` (`~/domain/workflow/types.js`), `RoutingStrategyService.order` (its result is the candidate order), `toRoutingEvaluation` (`~/domain/routing/toRoutingEvaluation.js`). The CMS and WB inspector wrappers return the engine's `RoutingInspection` unchanged (`InspectCmsEntryRoutingUseCase`, `InspectWebsiteBuilderPageRoutingUseCase`), and their resolvers answer `new Response(result.value)`. Test helpers: `createRoutingContext`, `resetRoutingFakes`, `ROUTING_USERS`, `LEGAL_TEAM_ID` (`~tests/__helpers/routingContext.js`), `readableUsers`, `readChecks` (`FakeReviewTargetReadAccess`), `folderChains`, `folderChainCalls`, `folderChainFaults` (`FakeReviewTargetFolderChain`), `FakeListUsers`, `NOW`, `requester`, `REVIEW_TEAM_ID`, `OTHER_TEAM_ID`, `ARTICLE_MODEL`, `targetContext` (`~tests/__helpers/fixtures.js`).
- Produces (matches the contract): `INSPECTION_CANDIDATE_LIMIT = 3`; `RoutingCondition`; `RoutingTraceOutcome` with `notEvaluated`; `RoutingTraceEntry.failedConditions?`; `RoutingInspectionTraceEntry`; `RoutingEvaluateParams.explain?`; `RoutingEvaluation.strategyOrder?`; `RoutingInspection.narrowedTeamId`, `candidateIds`, `candidateCount`; `getFailedRoutingConditions`; `listNotEvaluatedTrace`; the R289 SDL. Consumed by the admin Tasks 7, 7b (documents and mapper), 13 and 14c.

**Test runner note:** API package: each test file runs with `yarn test <path>` and then `yarn test:os <path>` (one `test:os` run at a time). The CMS and WB tests import `@webiny/api-workflows` from its build, so build it first (Step 4).

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/routing/getFailedRoutingConditions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getFailedRoutingConditions } from "~/domain/routing/getFailedRoutingConditions.js";
import { matchRoutingRuleConditions } from "~/domain/routing/matchRoutingRuleConditions.js";
import type { RoutingRuleConditions } from "~/domain/workflow/types.js";
import type { RoutingRuleFacts } from "~/domain/routing/types.js";

const FACTS: RoutingRuleFacts = {
    requesterId: "user-requester",
    requesterTeamIds: ["team-authors"],
    modelId: "article",
    folder: { id: "folder-child", type: "cms:article" },
    folderChainIds: ["folder-child", "folder-parent"]
};

const folder = (id: string, includeDescendants: boolean, type = "cms:article") => {
    return { id, type, includeDescendants };
};

describe("getFailedRoutingConditions (R289)", () => {
    it("names nothing for a rule without conditions and for conditions that hold", () => {
        expect(getFailedRoutingConditions({}, FACTS)).toEqual([]);
        expect(
            getFailedRoutingConditions(
                {
                    requesterUserId: "user-requester",
                    requesterTeamId: "team-authors",
                    folder: folder("folder-parent", true)
                },
                FACTS
            )
        ).toEqual([]);
    });

    it("names the requester, the requester's team and the folder, in that order", () => {
        expect(getFailedRoutingConditions({ requesterUserId: "user-other" }, FACTS)).toEqual([
            "requesterUser"
        ]);
        expect(getFailedRoutingConditions({ requesterTeamId: "team-other" }, FACTS)).toEqual([
            "requesterTeam"
        ]);
        expect(
            getFailedRoutingConditions({ folder: folder("folder-other", true) }, FACTS)
        ).toEqual(["folder"]);
        expect(
            getFailedRoutingConditions(
                {
                    folder: folder("folder-other", true),
                    requesterTeamId: "team-other",
                    requesterUserId: "user-other"
                },
                FACTS
            )
        ).toEqual(["requesterUser", "requesterTeam", "folder"]);
    });

    it("fails a folder condition for a target in the root and for a folder of another type", () => {
        expect(
            getFailedRoutingConditions({ folder: folder("folder-child", false) }, { ...FACTS, folder: null })
        ).toEqual(["folder"]);
        expect(
            getFailedRoutingConditions({ folder: folder("folder-child", false, "cms:blog") }, FACTS)
        ).toEqual(["folder"]);
    });

    it("matches the target folder itself and, with subfolders, its ancestors", () => {
        expect(getFailedRoutingConditions({ folder: folder("folder-child", false) }, FACTS)).toEqual(
            []
        );
        expect(getFailedRoutingConditions({ folder: folder("folder-parent", false) }, FACTS)).toEqual(
            ["folder"]
        );
        expect(getFailedRoutingConditions({ folder: folder("folder-parent", true) }, FACTS)).toEqual(
            []
        );
    });

    it("names nothing for a failed model id, which only fails the rule", () => {
        const conditions: RoutingRuleConditions = { modelId: "page" };

        expect(getFailedRoutingConditions(conditions, FACTS)).toEqual([]);
        expect(matchRoutingRuleConditions(conditions, FACTS)).toBe(false);
    });

    it("agrees with the matcher: a rule matches exactly when no condition failed and the model holds", () => {
        const cases: RoutingRuleConditions[] = [
            {},
            { requesterUserId: "user-requester" },
            { requesterUserId: "user-other" },
            { requesterTeamId: "team-other" },
            { folder: folder("folder-parent", true) },
            { folder: folder("folder-parent", false) },
            { folder: folder("folder-child", false, "cms:blog") },
            { requesterUserId: "user-requester", requesterTeamId: "team-authors", modelId: "article" }
        ];

        for (const conditions of cases) {
            const failed = getFailedRoutingConditions(conditions, FACTS);
            const modelHolds = !conditions.modelId || conditions.modelId === FACTS.modelId;
            expect(matchRoutingRuleConditions(conditions, FACTS)).toBe(
                failed.length === 0 && modelHolds
            );
        }
    });
});
```

Modify `packages/api-workflows/__tests__/routing/RoutingEvaluatorService.test.ts`: a new `describe` before the members block.

Before:

```ts
describe("RoutingEvaluatorService.listMembers and checkUser", () => {
```

After:

```ts
describe("RoutingEvaluatorService.evaluate: explain mode (R289)", () => {
    beforeEach(() => {
        resetRoutingFakes();
    });

    it("marks the rules after a deciding user rule not evaluated, assigns nothing for them and reads nothing for them", async () => {
        const { evaluator, teams } = await createEvaluatorContext();
        readableUsers.add(CARA.id);
        readableUsers.add(BOB.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                explain: true,
                config: stepConfig({
                    rules: [
                        userRule("rule-1", CARA.id),
                        userRule("rule-2", BOB.id),
                        teamRule("rule-3", REVIEW_TEAM_ID, { requesterTeamId: "team-x" })
                    ]
                })
            })
        );

        expect(result.value).toEqual({
            owner: CARA,
            source: "rule",
            ruleId: "rule-1",
            strategy: "none",
            candidateTeamIds: [REVIEW_TEAM_ID],
            reason: null,
            records: [outcome(CARA.id, "rule", "rule-1")],
            trace: [
                { ruleId: "rule-1", outcome: "matched", reason: null },
                { ruleId: "rule-2", outcome: "notEvaluated", reason: null, failedConditions: [] },
                { ruleId: "rule-3", outcome: "notEvaluated", reason: null, failedConditions: [] }
            ],
            skipped: []
        });
        expect(readChecks.map(call => call.userId)).toEqual([CARA.id]);
        expect(teams.calls).toEqual([]);
        expect(folderChainCalls).toEqual([]);
    });

    it("marks the rules after a deciding team rule not evaluated and narrows the candidates", async () => {
        const { evaluator } = await createEvaluatorContext();

        const result = await evaluator.evaluate(
            evaluateParams({
                explain: true,
                config: {
                    ...stepConfig({
                        rules: [teamRule("rule-1", LEGAL_TEAM_ID), userRule("rule-2", BOB.id)]
                    }),
                    teams: [REVIEW_TEAM_ID, LEGAL_TEAM_ID]
                }
            })
        );

        expect(result.value).toEqual({
            owner: null,
            source: "pool",
            ruleId: "rule-1",
            strategy: "none",
            candidateTeamIds: [LEGAL_TEAM_ID],
            reason: null,
            records: [outcome(null, "pool", "rule-1")],
            trace: [
                { ruleId: "rule-1", outcome: "matched", reason: null },
                { ruleId: "rule-2", outcome: "notEvaluated", reason: null, failedConditions: [] }
            ],
            skipped: []
        });
    });

    it("keeps walking after a skipped rule target", async () => {
        const { evaluator } = await createEvaluatorContext();

        const result = await evaluator.evaluate(
            evaluateParams({
                explain: true,
                config: stepConfig({
                    rules: [
                        userRule("rule-1", "user-dan"),
                        userRule("rule-2", BOB.id, { requesterUserId: "user-someone" })
                    ]
                })
            })
        );

        expect(result.value).toMatchObject({ owner: null, source: "pool", ruleId: null });
        expect(result.value.trace).toEqual([
            { ruleId: "rule-1", outcome: "skipped", reason: ROUTING_SKIP_REASONS.notMember },
            {
                ruleId: "rule-2",
                outcome: "notMatched",
                reason: null,
                failedConditions: ["requesterUser"]
            }
        ]);
    });

    it("names the failed conditions of each rule, single and combined, and reads teams and folders once", async () => {
        const { evaluator, teams } = await createEvaluatorContext();
        const other = { id: "folder-other", type: "cms:article", includeDescendants: false };

        const result = await evaluator.evaluate(
            evaluateParams({
                explain: true,
                config: stepConfig({
                    rules: [
                        teamRule("rule-user", REVIEW_TEAM_ID, { requesterUserId: "user-someone" }),
                        teamRule("rule-team", REVIEW_TEAM_ID, { requesterTeamId: "team-x" }),
                        teamRule("rule-folder", REVIEW_TEAM_ID, { folder: other }),
                        teamRule("rule-all", REVIEW_TEAM_ID, {
                            requesterUserId: "user-someone",
                            requesterTeamId: "team-x",
                            folder: other
                        }),
                        teamRule("rule-model", REVIEW_TEAM_ID, { modelId: "blog" }),
                        teamRule("rule-type", REVIEW_TEAM_ID, {
                            folder: { ...other, type: "cms:blog" }
                        })
                    ]
                })
            })
        );

        expect(result.value).toMatchObject({ owner: null, source: "pool", ruleId: null });
        expect(result.value.trace).toEqual([
            {
                ruleId: "rule-user",
                outcome: "notMatched",
                reason: null,
                failedConditions: ["requesterUser"]
            },
            {
                ruleId: "rule-team",
                outcome: "notMatched",
                reason: null,
                failedConditions: ["requesterTeam"]
            },
            {
                ruleId: "rule-folder",
                outcome: "notMatched",
                reason: null,
                failedConditions: ["folder"]
            },
            {
                ruleId: "rule-all",
                outcome: "notMatched",
                reason: null,
                failedConditions: ["requesterUser", "requesterTeam", "folder"]
            },
            { ruleId: "rule-model", outcome: "notMatched", reason: null, failedConditions: [] },
            {
                ruleId: "rule-type",
                outcome: "notMatched",
                reason: null,
                failedConditions: ["folder"]
            }
        ]);
        expect(teams.calls).toEqual([requester.id]);
        // Only a folder condition of the target's type needs the chain; read once.
        expect(folderChainCalls).toEqual([{ model: ARTICLE_MODEL, folderId: "folder-1" }]);
    });

    it("reads the folder chain for a rule that already failed a local condition, and passes its folder", async () => {
        const { evaluator } = await createEvaluatorContext();
        folderChains.set("folder-1", ["folder-1", "folder-parent"]);

        const result = await evaluator.evaluate(
            evaluateParams({
                explain: true,
                config: stepConfig({
                    rules: [
                        userRule("rule-1", BOB.id, {
                            requesterUserId: "user-someone",
                            folder: {
                                id: "folder-parent",
                                type: "cms:article",
                                includeDescendants: true
                            }
                        })
                    ]
                })
            })
        );

        expect(result.value.trace).toEqual([
            {
                ruleId: "rule-1",
                outcome: "notMatched",
                reason: null,
                failedConditions: ["requesterUser"]
            }
        ]);
        expect(folderChainCalls).toEqual([{ model: ARTICLE_MODEL, folderId: "folder-1" }]);
    });

    it("fails a folder condition for a target in the root without asking the folder port", async () => {
        const { evaluator } = await createEvaluatorContext();

        const result = await evaluator.evaluate(
            evaluateParams({
                explain: true,
                folder: null,
                config: stepConfig({
                    rules: [
                        userRule("rule-1", BOB.id, {
                            folder: {
                                id: "folder-1",
                                type: "cms:article",
                                includeDescendants: true
                            }
                        })
                    ]
                })
            })
        );

        expect(result.value.trace).toEqual([
            { ruleId: "rule-1", outcome: "notMatched", reason: null, failedConditions: ["folder"] }
        ]);
        expect(folderChainCalls).toEqual([]);
    });

    it("fails on a folder chain error only in explain mode", async () => {
        const { evaluator } = await createEvaluatorContext();
        folderChainFaults.throwNext = true;
        const config = stepConfig({
            rules: [
                userRule("rule-1", BOB.id, {
                    requesterUserId: "user-someone",
                    folder: { id: "folder-parent", type: "cms:article", includeDescendants: true }
                })
            ]
        });

        const live = await evaluator.evaluate(evaluateParams({ config }));
        const stillArmed = folderChainFaults.throwNext;
        const explained = await evaluator.evaluate(evaluateParams({ config, explain: true }));

        expect(live.isOk()).toBe(true);
        expect(stillArmed).toBe(true);
        expect(explained.isFail()).toBe(true);
        expect(explained.error.code).toBe("Workflows/Routing/Dependency");
        expect(explained.error.message).toBe("The folder read crashed.");
    });

    it("returns the strategy's order of the eligible candidates, also those who cannot read", async () => {
        const { evaluator } = await createEvaluatorContext();
        readableUsers.add(CARA.id);

        const result = await evaluator.evaluate(
            evaluateParams({ explain: true, config: stepConfig({ strategy: "roundRobin" }) })
        );

        expect(result.value).toMatchObject({ owner: CARA, source: "roundRobin" });
        expect(result.value.strategyOrder).toEqual([ANNA, BOB, CARA]);
        expect(result.value.skipped.map(item => item.userId)).toEqual([ANNA.id, BOB.id]);
    });

    it("returns the strategy's order when nobody can read and the step goes to the pool", async () => {
        const { evaluator } = await createEvaluatorContext();

        const result = await evaluator.evaluate(
            evaluateParams({ explain: true, config: stepConfig({ strategy: "leastLoaded" }) })
        );

        expect(result.value).toMatchObject({ owner: null, source: "pool" });
        expect(result.value.strategyOrder?.map(user => user.id)).toEqual([
            ANNA.id,
            BOB.id,
            CARA.id
        ]);
    });

    it("runs the strategy over the narrowed team's members and returns that order", async () => {
        const { evaluator } = await createEvaluatorContext();
        readableUsers.add(CARA.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                explain: true,
                config: {
                    ...stepConfig({
                        strategy: "roundRobin",
                        rules: [teamRule("rule-legal", LEGAL_TEAM_ID)]
                    }),
                    teams: [REVIEW_TEAM_ID, LEGAL_TEAM_ID]
                }
            })
        );

        expect(result.value).toMatchObject({
            owner: CARA,
            ruleId: "rule-legal",
            candidateTeamIds: [LEGAL_TEAM_ID]
        });
        expect(result.value.strategyOrder).toEqual([CARA]);
        expect(result.value.trace).toEqual([
            { ruleId: "rule-legal", outcome: "matched", reason: null }
        ]);
    });

    it("returns no strategy order when a rule chose the owner or the strategy is none", async () => {
        const { evaluator } = await createEvaluatorContext();
        readableUsers.add(CARA.id);

        const byRule = await evaluator.evaluate(
            evaluateParams({
                explain: true,
                config: stepConfig({ strategy: "roundRobin", rules: [userRule("rule-1", CARA.id)] })
            })
        );
        const none = await evaluator.evaluate(evaluateParams({ explain: true }));

        expect(byRule.value).toMatchObject({ owner: CARA, source: "rule" });
        expect(byRule.value.strategyOrder).toBeUndefined();
        expect(none.value.strategyOrder).toBeUndefined();
    });

    it("leaves live evaluation unchanged: lazy lookups, no not-evaluated entries, no failed conditions, no strategy order", async () => {
        const { evaluator, teams } = await createEvaluatorContext();
        readableUsers.add(CARA.id);
        readableUsers.add(requester.id);
        const folder = { id: "folder-1", type: "cms:article", includeDescendants: true };
        const rules = [
            userRule("rule-1", BOB.id, { requesterUserId: "user-someone", folder }),
            userRule("rule-2", CARA.id),
            userRule("rule-3", BOB.id, { requesterTeamId: "team-x", folder })
        ];

        const live = await evaluator.evaluate(
            evaluateParams({ config: stepConfig({ strategy: "roundRobin", rules }) })
        );

        expect(live.value).toMatchObject({ owner: CARA, source: "rule", ruleId: "rule-2" });
        expect(live.value.trace).toEqual([
            { ruleId: "rule-1", outcome: "notMatched", reason: null },
            { ruleId: "rule-2", outcome: "matched", reason: null }
        ]);
        expect(live.value).not.toHaveProperty("strategyOrder");
        expect(teams.calls).toEqual([]);
        expect(folderChainCalls).toEqual([]);
        expect(readChecks.map(call => call.userId)).toEqual([CARA.id]);
    });
});

describe("RoutingEvaluatorService.listMembers and checkUser", () => {
```

Modify `packages/api-workflows/__tests__/routing/InspectRouting.test.ts`.

The imports and the setup, so a test can add users.

Before:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createRoutingContext, resetRoutingFakes } from "~tests/__helpers/routingContext.js";
```

After:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import {
    createRoutingContext,
    LEGAL_TEAM_ID,
    resetRoutingFakes,
    ROUTING_USERS
} from "~tests/__helpers/routingContext.js";
import { FakeListUsers } from "~tests/__helpers/FakeListUsers.js";
```

Before:

```ts
import {
    ARTICLE_MODEL,
    NOW,
    requester,
    REVIEW_TEAM_ID,
    targetContext
} from "~tests/__helpers/fixtures.js";
```

After:

```ts
import {
    ARTICLE_MODEL,
    NOW,
    OTHER_TEAM_ID,
    requester,
    REVIEW_TEAM_ID,
    targetContext
} from "~tests/__helpers/fixtures.js";
```

Before:

```ts
const setup = async () => {
    const routing = await createRoutingContext();
    routing.users.calls.length = 0;
    return { ...routing, inspect: routing.context.container.resolve(InspectRoutingUseCase) };
};
```

After:

```ts
const teamRule = (id: string, teamId: string) => {
    return { id, conditions: {}, target: { type: "team", id: teamId } };
};

const strategyConfig = (strategy: string, rules: unknown[] = [], teams = [REVIEW_TEAM_ID]) => {
    return { teams, assignment: { strategy, allowManualPick: false, rules } };
};

const setup = async (params: CmsTestHandlerParams = {}) => {
    const routing = await createRoutingContext(params);
    routing.users.calls.length = 0;
    return { ...routing, inspect: routing.context.container.resolve(InspectRoutingUseCase) };
};
```

The existing expectations gain the new fields. The first test:

Before:

```ts
            trace: [
                {
                    ruleId: "rule-dan",
                    outcome: "skipped",
                    reason: "Not a member of the step's teams."
                },
                { ruleId: "rule-anna", outcome: "matched", reason: null }
            ],
            skipped: [
                {
                    userId: "user-dan",
                    displayName: null,
                    reason: "Not a member of the step's teams."
                }
            ]
        });
```

After:

```ts
            trace: [
                {
                    ruleId: "rule-dan",
                    outcome: "skipped",
                    reason: "Not a member of the step's teams.",
                    failedConditions: []
                },
                { ruleId: "rule-anna", outcome: "matched", reason: null, failedConditions: [] }
            ],
            skipped: [
                {
                    userId: "user-dan",
                    displayName: null,
                    reason: "Not a member of the step's teams."
                }
            ],
            narrowedTeamId: null,
            candidateIds: [],
            candidateCount: 0
        });
```

The exclusions test:

Before:

```ts
            trace: [
                { ruleId: "rule-anna", outcome: "skipped", reason: "On leave" },
                { ruleId: "rule-bob", outcome: "skipped", reason: "Excluded from reviews." }
            ],
            skipped: [
                { userId: "user-anna", displayName: "Anna", reason: "On leave" },
                { userId: "user-bob", displayName: "Bob", reason: "Excluded from reviews." }
            ]
        });
```

After:

```ts
            trace: [
                { ruleId: "rule-anna", outcome: "skipped", reason: "On leave", failedConditions: [] },
                {
                    ruleId: "rule-bob",
                    outcome: "skipped",
                    reason: "Excluded from reviews.",
                    failedConditions: []
                }
            ],
            skipped: [
                { userId: "user-anna", displayName: "Anna", reason: "On leave" },
                { userId: "user-bob", displayName: "Bob", reason: "Excluded from reviews." }
            ],
            narrowedTeamId: null,
            candidateIds: [],
            candidateCount: 0
        });
```

The pool test:

Before:

```ts
            strategy: "none",
            trace: [],
            skipped: []
        });
    });
```

After:

```ts
            strategy: "none",
            trace: [],
            skipped: [],
            narrowedTeamId: null,
            candidateIds: [],
            candidateCount: 0
        });
    });

    it("lists every rule in the trace and marks the rules after the deciding one not evaluated, without assigning them (R289)", async () => {
        const { inspect } = await setup();
        readableUsers.add("user-anna");
        readableUsers.add("user-bob");

        const result = await inspect.execute({
            stepConfig: stepConfig([
                userRule("rule-anna", "user-anna"),
                userRule("rule-bob", "user-bob"),
                teamRule("rule-team", REVIEW_TEAM_ID)
            ]),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: targetContext.folder,
            now: new Date(NOW)
        });

        expect(result.value).toMatchObject({
            owner: { id: "user-anna", displayName: "Anna" },
            source: "rule",
            ruleId: "rule-anna"
        });
        expect(result.value.trace).toEqual([
            { ruleId: "rule-anna", outcome: "matched", reason: null, failedConditions: [] },
            { ruleId: "rule-bob", outcome: "notEvaluated", reason: null, failedConditions: [] },
            { ruleId: "rule-team", outcome: "notEvaluated", reason: null, failedConditions: [] }
        ]);
        expect(readChecks.map(call => call.userId)).toEqual(["user-anna"]);
    });

    it("names the failed conditions of a rule that does not match", async () => {
        const { inspect } = await setup();
        const folder = { id: "folder-other", type: "cms:article", includeDescendants: true };

        const result = await inspect.execute({
            stepConfig: stepConfig([
                {
                    id: "rule-both",
                    conditions: { requesterUserId: "user-someone", requesterTeamId: "team-x" },
                    target: { type: "user", id: "user-anna" }
                },
                {
                    id: "rule-folder",
                    conditions: { requesterTeamId: OTHER_TEAM_ID, folder },
                    target: { type: "user", id: "user-anna" }
                },
                {
                    id: "rule-model",
                    conditions: { modelId: "blog" },
                    target: { type: "user", id: "user-anna" }
                }
            ]),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: targetContext.folder,
            now: new Date(NOW)
        });

        expect(result.value.trace).toEqual([
            {
                ruleId: "rule-both",
                outcome: "notMatched",
                reason: null,
                failedConditions: ["requesterUser", "requesterTeam"]
            },
            {
                ruleId: "rule-folder",
                outcome: "notMatched",
                reason: null,
                failedConditions: ["folder"]
            },
            { ruleId: "rule-model", outcome: "notMatched", reason: null, failedConditions: [] }
        ]);
        expect(result.value).toMatchObject({ owner: null, source: "pool", ruleId: null });
    });

    it("returns the narrowed team, the candidates of that team and their count", async () => {
        const { inspect } = await setup();
        readableUsers.add("user-cara");

        const result = await inspect.execute({
            stepConfig: strategyConfig("roundRobin", [teamRule("rule-legal", LEGAL_TEAM_ID)], [
                REVIEW_TEAM_ID,
                LEGAL_TEAM_ID
            ]),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: targetContext.folder,
            now: new Date(NOW)
        });

        expect(result.value).toMatchObject({
            owner: { id: "user-cara", displayName: "Cara" },
            source: "roundRobin",
            ruleId: "rule-legal",
            strategy: "roundRobin",
            narrowedTeamId: LEGAL_TEAM_ID,
            candidateIds: ["user-cara"],
            candidateCount: 1
        });
        expect(result.value.trace).toEqual([
            { ruleId: "rule-legal", outcome: "matched", reason: null, failedConditions: [] }
        ]);
    });

    it("returns the first three candidate ids in strategy order and counts all of them", async () => {
        const members = [
            ...ROUTING_USERS,
            { id: "user-dora", displayName: "Dora", teams: [REVIEW_TEAM_ID] },
            { id: "user-eve", displayName: "Eve", teams: [REVIEW_TEAM_ID] }
        ];
        const { inspect } = await setup({
            setup: container => {
                container.registerInstance(ListUsersUseCase, new FakeListUsers(members));
            }
        });
        for (const member of members) {
            readableUsers.add(member.id);
        }

        const result = await inspect.execute({
            stepConfig: strategyConfig("roundRobin"),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: targetContext.folder,
            now: new Date(NOW)
        });

        expect(result.value).toMatchObject({
            owner: { id: "user-anna", displayName: "Anna" },
            source: "roundRobin",
            narrowedTeamId: null,
            candidateIds: ["user-anna", "user-bob", "user-cara"],
            candidateCount: 5
        });
    });

    it("lists a candidate who cannot read, who is also a skipped person", async () => {
        const { inspect } = await setup();
        readableUsers.add("user-bob");

        const result = await inspect.execute({
            stepConfig: strategyConfig("leastLoaded"),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: targetContext.folder,
            now: new Date(NOW)
        });

        expect(result.value.owner).toEqual({ id: "user-bob", displayName: "Bob" });
        expect(result.value.candidateIds).toEqual(["user-anna", "user-bob", "user-cara"]);
        expect(result.value.skipped.map(item => item.userId)).toEqual(["user-anna"]);
    });

    it("returns no candidates when a rule chose the owner, the strategy is none or nobody is eligible", async () => {
        const { inspect, settings } = await setup();
        readableUsers.add("user-anna");
        const base = {
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: targetContext.folder,
            now: new Date(NOW)
        };

        const byRule = await inspect.execute({
            ...base,
            stepConfig: strategyConfig("roundRobin", [userRule("rule-anna", "user-anna")])
        });
        const none = await inspect.execute({ ...base, stepConfig: strategyConfig("none") });
        settings.exclusions = [
            { userId: "user-anna" },
            { userId: "user-bob" },
            { userId: "user-cara" }
        ];
        const nobody = await inspect.execute({ ...base, stepConfig: strategyConfig("roundRobin") });

        expect(byRule.value).toMatchObject({ source: "rule", candidateIds: [], candidateCount: 0 });
        expect(none.value).toMatchObject({ source: "pool", candidateIds: [], candidateCount: 0 });
        expect(nobody.value).toMatchObject({
            owner: null,
            source: "pool",
            candidateIds: [],
            candidateCount: 0
        });
    });

    it("returns no narrowed team for a rule that chose a person", async () => {
        const { inspect } = await setup();
        readableUsers.add("user-anna");

        const result = await inspect.execute({
            stepConfig: stepConfig([userRule("rule-anna", "user-anna")]),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: targetContext.folder,
            now: new Date(NOW)
        });

        expect(result.value.narrowedTeamId).toBeNull();
    });
```

Modify `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`: the introspection of the routing types.

Before:

```ts
        expect(memberNames(types, "WorkflowsRoutingTraceOutcome")).toEqual([
            "matched",
            "notMatched",
            "skipped"
        ]);
        expect(memberNames(types, "WorkflowsRoutingTraceEntry")).toEqual([
            "ruleId",
            "outcome",
            "reason"
        ]);
```

After:

```ts
        expect(memberNames(types, "WorkflowsRoutingTraceOutcome")).toEqual([
            "matched",
            "notMatched",
            "skipped",
            "notEvaluated"
        ]);
        expect(memberNames(types, "WorkflowsRoutingCondition")).toEqual([
            "requesterUser",
            "requesterTeam",
            "folder"
        ]);
        expect(memberNames(types, "WorkflowsRoutingTraceEntry")).toEqual([
            "ruleId",
            "outcome",
            "reason",
            "failedConditions"
        ]);
```

Before:

```ts
        expect(memberNames(types, "WorkflowsRoutingInspection")).toEqual([
            "owner",
            "source",
            "ruleId",
            "strategy",
            "trace",
            "skipped"
        ]);
```

After:

```ts
        expect(memberNames(types, "WorkflowsRoutingInspection")).toEqual([
            "owner",
            "source",
            "ruleId",
            "strategy",
            "trace",
            "skipped",
            "narrowedTeamId",
            "candidateIds",
            "candidateCount"
        ]);
```

Modify `packages/api-headless-cms-workflows/__tests__/graphql/cmsRoutingSchema.test.ts`.

Before:

```ts
const INSPECTION =
    "owner { id displayName } source ruleId strategy trace { ruleId outcome reason } skipped { userId displayName reason }";
```

After:

```ts
const INSPECTION =
    "owner { id displayName } source ruleId strategy trace { ruleId outcome reason failedConditions } skipped { userId displayName reason } narrowedTeamId candidateIds candidateCount";
```

Before:

```ts
                trace: [{ ruleId: "rule-1", outcome: "matched", reason: null }],
                skipped: []
            },
            error: null
        });
        expect(inRoot.inspectCmsEntryRouting.data).toEqual({
            owner: null,
            source: "pool",
            ruleId: null,
            strategy: "none",
            trace: [{ ruleId: "rule-1", outcome: "notMatched", reason: null }],
            skipped: []
        });
```

After:

```ts
                trace: [
                    { ruleId: "rule-1", outcome: "matched", reason: null, failedConditions: [] }
                ],
                skipped: [],
                narrowedTeamId: null,
                candidateIds: [],
                candidateCount: 0
            },
            error: null
        });
        expect(inRoot.inspectCmsEntryRouting.data).toEqual({
            owner: null,
            source: "pool",
            ruleId: null,
            strategy: "none",
            trace: [
                {
                    ruleId: "rule-1",
                    outcome: "notMatched",
                    reason: null,
                    failedConditions: ["folder"]
                }
            ],
            skipped: [],
            narrowedTeamId: null,
            candidateIds: [],
            candidateCount: 0
        });
```

Modify `packages/api-headless-cms-workflows/__tests__/wrappers/routingWrappers.test.ts`.

Before:

```ts
            trace: [{ ruleId: "rule-1", outcome: "matched", reason: null }],
            skipped: []
        });
        expect(inRoot).toEqual({
            owner: null,
            source: "pool",
            ruleId: null,
            strategy: "none",
            trace: [{ ruleId: "rule-1", outcome: "notMatched", reason: null }],
            skipped: []
        });
```

After:

```ts
            trace: [{ ruleId: "rule-1", outcome: "matched", reason: null, failedConditions: [] }],
            skipped: [],
            narrowedTeamId: null,
            candidateIds: [],
            candidateCount: 0
        });
        expect(inRoot).toEqual({
            owner: null,
            source: "pool",
            ruleId: null,
            strategy: "none",
            trace: [
                {
                    ruleId: "rule-1",
                    outcome: "notMatched",
                    reason: null,
                    failedConditions: ["folder"]
                }
            ],
            skipped: [],
            narrowedTeamId: null,
            candidateIds: [],
            candidateCount: 0
        });
```

Before:

```ts
            expect(inspection.trace).toEqual([
                { ruleId: "rule-1", outcome: "notMatched", reason: null }
            ]);
```

After:

```ts
            expect(inspection.trace).toEqual([
                {
                    ruleId: "rule-1",
                    outcome: "notMatched",
                    reason: null,
                    failedConditions: ["folder"]
                }
            ]);
```

Before:

```ts
        expect(inspection.trace).toEqual([
            { ruleId: "rule-1", outcome: "skipped", reason: "Cannot read this content." }
        ]);
```

After:

```ts
        expect(inspection.trace).toEqual([
            {
                ruleId: "rule-1",
                outcome: "skipped",
                reason: "Cannot read this content.",
                failedConditions: []
            }
        ]);
```

Modify `packages/api-website-builder-workflows/__tests__/__helpers/graphql.ts`: the inspection selection.

Before:

```ts
    trace {
        ruleId
        outcome
        reason
    }
    skipped {
        userId
        displayName
        reason
    }
`;
```

After:

```ts
    trace {
        ruleId
        outcome
        reason
        failedConditions
    }
    skipped {
        userId
        displayName
        reason
    }
    narrowedTeamId
    candidateIds
    candidateCount
`;
```

Modify `packages/api-website-builder-workflows/__tests__/graphql/pageRouting.test.ts`.

Before:

```ts
                trace: [{ ruleId: "rule-campaigns", outcome: "matched", reason: null }],
                skipped: []
            },
            error: null
        });
        expect(inRoot.inspectWebsiteBuilderPageRouting.data).toEqual({
            owner: null,
            source: "pool",
            ruleId: null,
            strategy: "none",
            trace: [{ ruleId: "rule-campaigns", outcome: "notMatched", reason: null }],
            skipped: []
        });
```

After:

```ts
                trace: [
                    {
                        ruleId: "rule-campaigns",
                        outcome: "matched",
                        reason: null,
                        failedConditions: []
                    }
                ],
                skipped: [],
                narrowedTeamId: null,
                candidateIds: [],
                candidateCount: 0
            },
            error: null
        });
        expect(inRoot.inspectWebsiteBuilderPageRouting.data).toEqual({
            owner: null,
            source: "pool",
            ruleId: null,
            strategy: "none",
            trace: [
                {
                    ruleId: "rule-campaigns",
                    outcome: "notMatched",
                    reason: null,
                    failedConditions: ["folder"]
                }
            ],
            skipped: [],
            narrowedTeamId: null,
            candidateIds: [],
            candidateCount: 0
        });
```

Modify `packages/api-website-builder-workflows/__tests__/wrappers/routingWrappers.test.ts`.

Before:

```ts
            trace: [{ ruleId: "rule-campaigns", outcome: "matched", reason: null }],
            skipped: []
        });
        expect(inRoot).toEqual({
            owner: null,
            source: "pool",
            ruleId: null,
            strategy: "none",
            trace: [{ ruleId: "rule-campaigns", outcome: "notMatched", reason: null }],
            skipped: []
        });
```

After:

```ts
            trace: [
                {
                    ruleId: "rule-campaigns",
                    outcome: "matched",
                    reason: null,
                    failedConditions: []
                }
            ],
            skipped: [],
            narrowedTeamId: null,
            candidateIds: [],
            candidateCount: 0
        });
        expect(inRoot).toEqual({
            owner: null,
            source: "pool",
            ruleId: null,
            strategy: "none",
            trace: [
                {
                    ruleId: "rule-campaigns",
                    outcome: "notMatched",
                    reason: null,
                    failedConditions: ["folder"]
                }
            ],
            skipped: [],
            narrowedTeamId: null,
            candidateIds: [],
            candidateCount: 0
        });
```

Before:

```ts
            expect(inspection.trace).toEqual([
                { ruleId: "rule-campaigns", outcome: "notMatched", reason: null }
            ]);
```

After:

```ts
            expect(inspection.trace).toEqual([
                {
                    ruleId: "rule-campaigns",
                    outcome: "notMatched",
                    reason: null,
                    failedConditions: ["folder"]
                }
            ]);
```

Before:

```ts
        expect(inspection.trace).toEqual([
            { ruleId: "rule-campaigns", outcome: "skipped", reason: "Cannot read this content." }
        ]);
```

After:

```ts
        expect(inspection.trace).toEqual([
            {
                ruleId: "rule-campaigns",
                outcome: "skipped",
                reason: "Cannot read this content.",
                failedConditions: []
            }
        ]);
```

- [ ] **Step 2: Run the tests to see them fail**

Run each api-workflows file on its own:
`yarn test packages/api-workflows/__tests__/routing/getFailedRoutingConditions.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/routing/RoutingEvaluatorService.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/routing/InspectRouting.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50`
Expected: FAIL. The first fails to load its import (`~/domain/routing/getFailedRoutingConditions.js` does not exist); the evaluator tests report the old trace (no `notEvaluated`, no `failedConditions`, `strategyOrder` undefined); the inspector tests miss `narrowedTeamId`, `candidateIds` and `candidateCount`; the schema test fails on the member lists (`expected [ 'matched', 'notMatched', 'skipped' ] to deeply equal [ ..., 'notEvaluated' ]`).

- [ ] **Step 3: Implement**

Modify `packages/api-workflows/src/constants.ts`: add the limit after the teams flag (Task 2).

Before:

```ts
export const TEAMS_FEATURE_FLAG = "advancedAccessControlLayer.teams";
```

After:

```ts
export const TEAMS_FEATURE_FLAG = "advancedAccessControlLayer.teams";

/** How many candidate ids the routing inspector returns (R289); the count covers all of them. */
export const INSPECTION_CANDIDATE_LIMIT = 3;
```

Modify `packages/api-workflows/src/domain/routing/types.ts`.

The outcome, the condition names and the trace entry.

Before:

```ts
export type RoutingTraceOutcome = "matched" | "notMatched" | "skipped";

/** One evaluated rule, for the inspector (R121). No load numbers. */
export interface RoutingTraceEntry {
    ruleId: string;
    outcome: RoutingTraceOutcome;
    /**
     * The skip reason for `skipped`; `null` otherwise. An excluded user target shows the
     * exclusion's own reason, or "Excluded from reviews." when it has none (R129, D118).
     */
    reason: string | null;
}
```

After:

```ts
/**
 * `notEvaluated` is a rule after the deciding one; only an inspector evaluation (`explain`) lists
 * such rules (R289).
 */
export type RoutingTraceOutcome = "matched" | "notMatched" | "skipped" | "notEvaluated";

/**
 * The rule conditions the editor can name when a rule does not match (R289). A failed `modelId`
 * condition names nothing.
 */
export type RoutingCondition = "requesterUser" | "requesterTeam" | "folder";

/** One evaluated rule, for the inspector (R121). No load numbers. */
export interface RoutingTraceEntry {
    ruleId: string;
    outcome: RoutingTraceOutcome;
    /**
     * The skip reason for `skipped`; `null` otherwise. An excluded user target shows the
     * exclusion's own reason, or "Excluded from reviews." when it has none (R129, D118).
     */
    reason: string | null;
    /**
     * The conditions that failed, set on `notMatched` entries of an inspector evaluation
     * (`explain`); absent in live assignment, which stops at the first failed condition.
     */
    failedConditions?: RoutingCondition[];
}

/** A trace entry of the inspector's answer: `failedConditions` is always there (R289). */
export interface RoutingInspectionTraceEntry extends RoutingTraceEntry {
    failedConditions: RoutingCondition[];
}
```

The evaluate params.

Before:

```ts
    read: RoutingReadScope;
    /** The reach time (R118): exclusion expiry is evaluated at this instant. */
    now: Date;
}

/** The decision for one step (spec 6). */
```

After:

```ts
    read: RoutingReadScope;
    /** The reach time (R118): exclusion expiry is evaluated at this instant. */
    now: Date;
    /**
     * Inspector mode (R289): evaluate every condition of every rule up to the deciding one, name
     * the failed conditions, list the later rules as `notEvaluated` and return the strategy's
     * candidate order. Absent or false is live assignment, which stays lazy.
     */
    explain?: boolean;
}

/** The decision for one step (spec 6). */
```

The evaluation.

Before:

```ts
    /** The skipped people in decision order, with the trace's reasons (R129). */
    skipped: RoutingSkippedUser[];
}

export interface RoutingMembersParams {
```

After:

```ts
    /** The skipped people in decision order, with the trace's reasons (R129). */
    skipped: RoutingSkippedUser[];
    /**
     * The strategy's order of the eligible candidates, before read access is checked. Set only in
     * inspector mode (`explain`) and only when a strategy ran: absent when a rule chose the owner
     * or the strategy is `none` (R289).
     */
    strategyOrder?: RoutingUser[];
}

export interface RoutingMembersParams {
```

The inspection.

Before:

```ts
    /** Excluded rule targets show the exclusion's own reason; editor only (R129, D118). */
    trace: RoutingTraceEntry[];
    /** The skipped people with the trace's reasons (R129, D118). */
    skipped: RoutingSkippedUser[];
}
```

After:

```ts
    /**
     * Every rule in order (R289). Excluded rule targets show the exclusion's own reason; editor
     * only (R129, D118).
     */
    trace: RoutingInspectionTraceEntry[];
    /** The skipped people with the trace's reasons (R129, D118). */
    skipped: RoutingSkippedUser[];
    /** The team a matched team-target rule narrowed the candidates to; null otherwise (R289). */
    narrowedTeamId: string | null;
    /** The first `INSPECTION_CANDIDATE_LIMIT` candidates in the strategy's order (R289). */
    candidateIds: string[];
    /** All candidates of the strategy, so the editor can say "and others" (R289). */
    candidateCount: number;
}
```

Create `packages/api-workflows/src/domain/routing/getFailedRoutingConditions.ts`:

```ts
import type { RoutingRuleConditions } from "~/domain/workflow/types.js";
import type { RoutingCondition, RoutingRuleFacts } from "./types.js";

/**
 * The conditions of a rule that do not hold, in the order requester, requester's team, folder
 * (R289). Pure; the facts must carry the requester's teams and the folder chain, so the inspector
 * reads them for every rule it explains. A failed `modelId` condition names nothing here: it
 * fails the rule (`matchRoutingRuleConditions`) but the editor has no such condition. The folder
 * rules are those of `matchRoutingRuleConditions`: a target in the root or of another type
 * fails, the target folder matches, and with `includeDescendants` so do its ancestors.
 */
export const getFailedRoutingConditions = (
    conditions: RoutingRuleConditions,
    facts: RoutingRuleFacts
): RoutingCondition[] => {
    const failed: RoutingCondition[] = [];
    if (conditions.requesterUserId && conditions.requesterUserId !== facts.requesterId) {
        failed.push("requesterUser");
    }
    if (
        conditions.requesterTeamId &&
        !facts.requesterTeamIds.includes(conditions.requesterTeamId)
    ) {
        failed.push("requesterTeam");
    }
    const folder = conditions.folder;
    if (folder) {
        if (!facts.folder || folder.type !== facts.folder.type) {
            failed.push("folder");
        } else {
            const isTargetFolder = folder.id === facts.folder.id;
            const inChain = folder.includeDescendants && facts.folderChainIds.includes(folder.id);
            if (!isTargetFolder && !inChain) {
                failed.push("folder");
            }
        }
    }
    return failed;
};
```

Create `packages/api-workflows/src/domain/routing/listNotEvaluatedTrace.ts`:

```ts
import type { RoutingRule } from "~/domain/workflow/types.js";
import type { RoutingTraceEntry } from "./types.js";

/**
 * The trace entries of the rules from `fromIndex` on, after the rule that decided (R289): outcome
 * `notEvaluated`, no reason, no failed conditions. Pure.
 */
export const listNotEvaluatedTrace = (
    rules: RoutingRule[],
    fromIndex: number
): RoutingTraceEntry[] => {
    return rules.slice(fromIndex).map((rule): RoutingTraceEntry => {
        return { ruleId: rule.id, outcome: "notEvaluated", reason: null, failedConditions: [] };
    });
};
```

Replace `packages/api-workflows/src/domain/routing/toRoutingEvaluation.ts` in full:

```ts
import type { AssignmentDecision } from "~/domain/assignment/types.js";
import type { RoutingStrategy } from "~/domain/workflow/types.js";
import type {
    RoutingEvaluation,
    RoutingSkippedUser,
    RoutingSource,
    RoutingTraceEntry,
    RoutingUser
} from "./types.js";

export interface RoutingDecisionInput {
    owner: RoutingUser | null;
    source: RoutingSource;
    ruleId: string | null;
    strategy: RoutingStrategy;
    candidateTeamIds: string[];
    reason: string | null;
    /** The skips so far, in decision order. */
    skips: AssignmentDecision[];
    trace: RoutingTraceEntry[];
    /** The skipped people so far, in decision order (R129). */
    skipped: RoutingSkippedUser[];
    /** The strategy's candidate order; given only in inspector mode when a strategy ran (R289). */
    strategyOrder?: RoutingUser[];
}

/** The evaluation with its outcome record appended after the skips (R117). Pure. */
export const toRoutingEvaluation = (input: RoutingDecisionInput): RoutingEvaluation => {
    const evaluation: RoutingEvaluation = {
        owner: input.owner ? { ...input.owner } : null,
        source: input.source,
        ruleId: input.ruleId,
        strategy: input.strategy,
        candidateTeamIds: [...input.candidateTeamIds],
        reason: input.reason,
        records: [
            ...input.skips.map(skip => ({ ...skip })),
            {
                kind: "outcome",
                userId: input.owner?.id ?? null,
                source: input.source,
                ruleId: input.ruleId,
                by: null,
                reason: input.reason
            }
        ],
        trace: input.trace.map(entry => ({ ...entry })),
        skipped: input.skipped.map(item => ({ ...item }))
    };
    if (input.strategyOrder) {
        evaluation.strategyOrder = input.strategyOrder.map(user => ({ ...user }));
    }
    return evaluation;
};
```

Modify `packages/api-workflows/src/features/routing/RoutingEvaluatorService/RoutingEvaluatorService.ts`.

The imports.

Before:

```ts
import { getNamespaceModelId } from "~/domain/routing/getNamespaceModelId.js";
import { getRoutingUserSkipReason } from "~/domain/routing/getRoutingUserSkipReason.js";
import { listRoutingCandidates } from "~/domain/routing/listRoutingCandidates.js";
```

After:

```ts
import { getFailedRoutingConditions } from "~/domain/routing/getFailedRoutingConditions.js";
import { getNamespaceModelId } from "~/domain/routing/getNamespaceModelId.js";
import { getRoutingUserSkipReason } from "~/domain/routing/getRoutingUserSkipReason.js";
import { listNotEvaluatedTrace } from "~/domain/routing/listNotEvaluatedTrace.js";
import { listRoutingCandidates } from "~/domain/routing/listRoutingCandidates.js";
```

The mode flag.

Before:

```ts
        const strategy = config.assignment.strategy;
        const rules = config.assignment.rules;
        const skips: AssignmentDecision[] = [];
```

After:

```ts
        const strategy = config.assignment.strategy;
        const rules = config.assignment.rules;
        // Inspector mode (R289); live assignment stays lazy.
        const explain = params.explain === true;
        const skips: AssignmentDecision[] = [];
```

The index of a deciding team rule.

Before:

```ts
        let candidateTeamIds = [...config.teams];
        let ruleId: string | null = null;
        if (rules.length > 0) {
```

After:

```ts
        let candidateTeamIds = [...config.teams];
        let ruleId: string | null = null;
        // The index of a team rule that narrowed the candidates; the rules after it are listed as
        // not evaluated in inspector mode (R289).
        let decidedIndex = -1;
        if (rules.length > 0) {
```

The loop header and the local check.

Before:

```ts
            for (const rule of rules) {
                // The conditions that need no lookup first: a rule that fails them reads
                // neither the requester's teams nor the folder chain.
                const localFacts: RoutingRuleLocalFacts = {
                    requesterId: params.requesterId,
                    modelId,
                    folder: params.folder
                };
                if (!matchRoutingRuleLocalConditions(rule.conditions, localFacts)) {
                    trace.push({ ruleId: rule.id, outcome: "notMatched", reason: null });
                    continue;
                }
```

After:

```ts
            for (const [ruleIndex, rule] of rules.entries()) {
                // The conditions that need no lookup first: a live rule that fails them reads
                // neither the requester's teams nor the folder chain. The inspector goes on and
                // reads them, so it can name every failed condition (R289).
                const localFacts: RoutingRuleLocalFacts = {
                    requesterId: params.requesterId,
                    modelId,
                    folder: params.folder
                };
                const localMatch = matchRoutingRuleLocalConditions(rule.conditions, localFacts);
                if (!explain && !localMatch) {
                    trace.push({ ruleId: rule.id, outcome: "notMatched", reason: null });
                    continue;
                }
```

The folder chain read: only for a folder condition of the target folder's type, which is every live rule that reaches this point.

Before:

```ts
                if (rule.conditions.folder && params.folder && folderChainIds === null) {
```

After:

```ts
                const folderCondition = rule.conditions.folder;
                if (
                    folderCondition &&
                    params.folder &&
                    folderCondition.type === params.folder.type &&
                    folderChainIds === null
                ) {
```

The rule that does not match.

Before:

```ts
                if (!matchRoutingRuleConditions(rule.conditions, facts)) {
                    trace.push({ ruleId: rule.id, outcome: "notMatched", reason: null });
                    continue;
                }
                if (rule.target.type === "team") {
```

After:

```ts
                if (!matchRoutingRuleConditions(rule.conditions, facts)) {
                    const notMatched: RoutingTraceEntry = {
                        ruleId: rule.id,
                        outcome: "notMatched",
                        reason: null
                    };
                    if (explain) {
                        notMatched.failedConditions = getFailedRoutingConditions(
                            rule.conditions,
                            facts
                        );
                    }
                    trace.push(notMatched);
                    continue;
                }
                if (rule.target.type === "team") {
```

A team rule that decides.

Before:

```ts
                    trace.push({ ruleId: rule.id, outcome: "matched", reason: null });
                    ruleId = rule.id;
                    candidateTeamIds = [rule.target.id];
                    break;
```

After:

```ts
                    trace.push({ ruleId: rule.id, outcome: "matched", reason: null });
                    ruleId = rule.id;
                    candidateTeamIds = [rule.target.id];
                    decidedIndex = ruleIndex;
                    break;
```

A user rule that decides.

Before:

```ts
                    if (canRead) {
                        trace.push({ ruleId: rule.id, outcome: "matched", reason: null });
                        return Result.ok(
```

After:

```ts
                    if (canRead) {
                        trace.push({ ruleId: rule.id, outcome: "matched", reason: null });
                        if (explain) {
                            const notEvaluated = listNotEvaluatedTrace(rules, ruleIndex + 1);
                            trace.push(...notEvaluated);
                        }
                        return Result.ok(
```

The rules after a team rule that narrowed the candidates.

Before:

```ts
        // 3. The strategy over the candidates, then 4. the pool (R110).
        if (strategy === "none") {
```

After:

```ts
        // The rules after a team rule that decided were not evaluated (R289).
        if (explain && decidedIndex >= 0) {
            const notEvaluated = listNotEvaluatedTrace(rules, decidedIndex + 1);
            trace.push(...notEvaluated);
        }

        // 3. The strategy over the candidates, then 4. the pool (R110).
        if (strategy === "none") {
```

The strategy order, passed to both results of a strategy run.

Before:

```ts
        // Read access is checked lazily in strategy order, stopping at the first readable
        // candidate (R111, A47).
        for (const candidate of ordered.value) {
```

After:

```ts
        // The inspector shows the order the strategy considers (R289).
        const strategyOrder = explain ? ordered.value : undefined;
        // Read access is checked lazily in strategy order, stopping at the first readable
        // candidate (R111, A47).
        for (const candidate of ordered.value) {
```

Before:

```ts
                        owner: candidate,
                        source: strategy,
                        ruleId,
                        strategy,
                        candidateTeamIds,
                        reason: null,
                        skips,
                        trace,
                        skipped
                    })
```

After:

```ts
                        owner: candidate,
                        source: strategy,
                        ruleId,
                        strategy,
                        candidateTeamIds,
                        reason: null,
                        skips,
                        trace,
                        skipped,
                        strategyOrder
                    })
```

Before:

```ts
                reason: ROUTING_NO_CANDIDATE_REASON,
                skips,
                trace,
                skipped
            })
```

After:

```ts
                reason: ROUTING_NO_CANDIDATE_REASON,
                skips,
                trace,
                skipped,
                strategyOrder
            })
```

Replace `packages/api-workflows/src/features/routing/InspectRouting/InspectRoutingUseCase.ts` in full (it includes the Task 3 edits):

```ts
import { Result } from "@webiny/feature/api";
import { INSPECTION_CANDIDATE_LIMIT } from "~/constants.js";
import { reviewStepConfigSchema } from "~/domain/workflow/reviewStepConfigSchema.js";
import { WorkflowValidationError } from "~/domain/workflow/errors.js";
import { findReviewStepConfigProblem } from "~/domain/workflow/findReviewStepConfigProblem.js";
import { findRuleWithoutTarget } from "~/domain/workflow/findRuleWithoutTarget.js";
import { getRuleTargetMissingMessage } from "~/domain/workflow/ruleErrorMessages.js";
import { RULE_TARGET_FIELD } from "~/domain/workflow/ruleErrorMessages.js";
import { RULE_TARGET_TEAM_OUTSIDE_TEAMS_MESSAGE } from "~/domain/workflow/ruleErrorMessages.js";
import type { RoutingRule } from "~/domain/workflow/types.js";
import { RoutingDependencyError } from "~/domain/routing/errors.js";
import type {
    RoutingEvaluation,
    RoutingInspectionTraceEntry,
    RoutingTraceEntry
} from "~/domain/routing/types.js";
import { RoutingEvaluatorService } from "~/features/routing/RoutingEvaluatorService/index.js";
import { InspectRoutingUseCase as UseCase } from "./abstractions.js";

/** Every entry carries its failed conditions, empty unless a rule did not match (R289). */
const toInspectionTrace = (trace: RoutingTraceEntry[]): RoutingInspectionTraceEntry[] => {
    return trace.map(entry => {
        return {
            ruleId: entry.ruleId,
            outcome: entry.outcome,
            reason: entry.reason,
            failedConditions: [...(entry.failedConditions ?? [])]
        };
    });
};

/** The team a matched team-target rule narrowed the candidates to; null for any other rule. */
const findNarrowedTeamId = (rules: RoutingRule[], ruleId: string | null): string | null => {
    const rule = rules.find(item => item.id === ruleId);
    if (rule && rule.target.type === "team") {
        return rule.target.id;
    }
    return null;
};

class InspectRoutingUseCaseImpl implements UseCase.Interface {
    constructor(private routing: RoutingEvaluatorService.Interface) {}

    async execute(input: UseCase.Input): UseCase.Return {
        // A rule without a target is named by its id, before the schema reports it by index. The
        // editor tests incomplete rules too, so this is a message for Test routing (R288).
        const withoutTarget = findRuleWithoutTarget(input.stepConfig);
        if (withoutTarget) {
            return Result.fail(
                new WorkflowValidationError(getRuleTargetMissingMessage(null), {
                    field: RULE_TARGET_FIELD,
                    ruleId: withoutTarget.ruleId
                })
            );
        }

        const parsed = reviewStepConfigSchema.safeParse(input.stepConfig);
        if (!parsed.success) {
            const [issue] = parsed.error.issues;
            return Result.fail(
                new WorkflowValidationError(
                    `The step configuration is invalid: ${issue?.message ?? "unknown error"}`
                )
            );
        }
        // Save refuses a step without teams and a team target outside the step's teams
        // (spec 4.1, 6); the inspector does too, before any lookup.
        const problem = findReviewStepConfigProblem(parsed.data);
        if (problem?.type === "noTeams") {
            return Result.fail(
                new WorkflowValidationError(
                    "The step configuration is invalid: the step needs at least one team."
                )
            );
        }
        if (problem?.type === "teamTargetOutsideTeams") {
            return Result.fail(
                new WorkflowValidationError(RULE_TARGET_TEAM_OUTSIDE_TEAMS_MESSAGE, {
                    field: RULE_TARGET_FIELD,
                    ruleId: problem.ruleId
                })
            );
        }

        // An unsaved config has no stored workflow: no round-robin history, no pick. Read access
        // is checked at folder level as the request identity (A47). Inspector mode
        // explains every rule (R289).
        let evaluated: Result<RoutingEvaluation, RoutingDependencyError>;
        try {
            evaluated = await this.routing.evaluate({
                config: parsed.data,
                model: input.model,
                workflowId: null,
                reviewId: null,
                stepId: "",
                requesterId: input.requesterId,
                pickedUserId: null,
                folder: input.folder ? { ...input.folder } : null,
                read: { type: "folder", folderId: input.folder?.id ?? null },
                now: input.now,
                explain: true
            });
        } catch (error) {
            return Result.fail(
                new RoutingDependencyError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (evaluated.isFail()) {
            return Result.fail(evaluated.error);
        }
        const evaluation = evaluated.value;

        const strategyOrder = evaluation.strategyOrder ?? [];
        const firstCandidates = strategyOrder.slice(0, INSPECTION_CANDIDATE_LIMIT);
        const candidateIds = firstCandidates.map(candidate => candidate.id);
        const narrowedTeamId = findNarrowedTeamId(parsed.data.assignment.rules, evaluation.ruleId);

        return Result.ok({
            owner: evaluation.owner
                ? { id: evaluation.owner.id, displayName: evaluation.owner.displayName }
                : null,
            source: evaluation.source,
            ruleId: evaluation.ruleId,
            strategy: evaluation.strategy,
            trace: toInspectionTrace(evaluation.trace),
            skipped: evaluation.skipped.map(item => ({ ...item })),
            narrowedTeamId,
            candidateIds,
            candidateCount: strategyOrder.length
        });
    }
}

export const InspectRoutingUseCase = UseCase.createImplementation({
    implementation: InspectRoutingUseCaseImpl,
    dependencies: [RoutingEvaluatorService]
});
```

Modify `packages/api-workflows/src/features/routing/InspectRouting/index.ts`.

Before:

```ts
export type {
    RoutingInspection,
    RoutingSkippedUser,
    RoutingTraceEntry
} from "~/domain/routing/types.js";
```

After:

```ts
export type {
    RoutingInspection,
    RoutingInspectionTraceEntry,
    RoutingSkippedUser,
    RoutingTraceEntry
} from "~/domain/routing/types.js";
```

Modify `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`: the routing types.

Before:

```graphql
    enum WorkflowsRoutingTraceOutcome {
        matched
        notMatched
        skipped
    }

    type WorkflowsRoutingTraceEntry {
        ruleId: String!
        outcome: WorkflowsRoutingTraceOutcome!
        reason: String
    }
```

After:

```graphql
    "notEvaluated is a rule after the deciding one (R289)."
    enum WorkflowsRoutingTraceOutcome {
        matched
        notMatched
        skipped
        notEvaluated
    }

    "A rule condition the editor can name when a rule does not match (R289)."
    enum WorkflowsRoutingCondition {
        requesterUser
        requesterTeam
        folder
    }

    type WorkflowsRoutingTraceEntry {
        ruleId: String!
        outcome: WorkflowsRoutingTraceOutcome!
        reason: String
        "The conditions that failed; empty unless the rule did not match (R289)."
        failedConditions: [WorkflowsRoutingCondition!]!
    }
```

Before:

```graphql
        "The step's configured strategy."
        strategy: String!
        trace: [WorkflowsRoutingTraceEntry!]!
        skipped: [WorkflowsRoutingSkip!]!
    }
```

After:

```graphql
        "The step's configured strategy."
        strategy: String!
        "Every rule, in order (R289)."
        trace: [WorkflowsRoutingTraceEntry!]!
        skipped: [WorkflowsRoutingSkip!]!
        "The team a matched team-target rule narrowed the candidates to; null otherwise."
        narrowedTeamId: ID
        "The first three candidates in the strategy's order; empty when a rule chose the owner or nobody is eligible."
        candidateIds: [ID!]!
        "All candidates of the strategy."
        candidateCount: Int!
    }
```

- [ ] **Step 4: Run the tests to see them pass**

Run each api-workflows file on its own:
`yarn test packages/api-workflows/__tests__/routing/getFailedRoutingConditions.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/routing/RoutingEvaluatorService.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/routing/InspectRouting.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50`
and the same four with `yarn test:os` (one at a time).
Expected: PASS.

The CMS and WB packages read `@webiny/api-workflows` from its build, so build it, then run their files:
`yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30`
`yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsRoutingSchema.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/wrappers/routingWrappers.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/graphql/pageRouting.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/wrappers/routingWrappers.test.ts 2>&1 | tail -50`
and the same four with `yarn test:os` (one at a time).
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

Live assignment shares the evaluator, `toRoutingEvaluation` and the types:
`yarn test packages/api-workflows/__tests__/routing/RoutingStepAssignmentResolver.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/routing/ListStepCandidates.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/routing/RoutingStrategyService.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/routing/strategyOrder.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/routing/matchRoutingRuleConditions.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/review/ReviewStepReacher.test.ts 2>&1 | tail -50`
and the same six with `yarn test:os` (one at a time).
Expected: PASS (none of them changes in this task).

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
`yarn check:test:types -p api-headless-cms-workflows --report cli 2>&1 | tail -40`
`yarn check:test:types -p api-website-builder-workflows --report cli 2>&1 | tail -40`
Expected: no errors. (`for (const [ruleIndex, rule] of rules.entries())` needs the array iterator, which the packages' `target` allows; if the type check refuses it, loop over `rules` with a counter variable instead and keep the rest. The `members` array of the many-candidates test is typed from `ROUTING_USERS` (`FakeUser[]`) plus two literals with the same shape.)

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain of phase 8a (`docs/.bruno/plans/2026-10-16-workflows-phase-8a/00-shared.md`) in full: `git add .`, `yarn > /dev/null 2>&1`, `node scripts/generateTsConfigsInPackages.js`, `yarn adio`, `yarn check-ts-configs`, `yarn format:fix > /dev/null 2>&1`, `yarn lint:fix`, `yarn webiny sync-dependencies`, `yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30`, `git add .`. Restore `.gitleaks.toml` (`git checkout -- .gitleaks.toml`); never commit it, `docs/.reports` or `.superpowers`. If any step fails and you fix something, rerun the chain from the start. Then commit:

```
git commit -m "feat(api-workflows): explain every rule in inspectRouting" -m "The inspector lists every rule in the trace (rules after the deciding one are notEvaluated), names the failed conditions of a rule that does not match, and returns the narrowed team, the first three candidate ids and the candidate count. Live assignment is unchanged: only the inspector sets the new explain flag." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

## Contract notes

- The contract lists `RoutingEvaluateParams.explain: boolean`. The plan makes it optional (`explain?: boolean`, absent is false) so the live caller `RoutingStepAssignmentResolver` and the many evaluator tests keep compiling unchanged.
- The contract says `RoutingEvaluation` and `toRoutingEvaluation.ts` "carry the new fields" and that the strategy order is returned by the evaluator. The plan adds one optional field, `strategyOrder?: RoutingUser[]`, set only in inspector mode; `InspectRoutingUseCase` derives `candidateIds` (first 3) and `candidateCount` (all) from it, and `narrowedTeamId` from `ruleId` and the step's rules (R289: "derived from ruleId and the step's teams"). `RoutingTraceEntry.failedConditions` is likewise optional on the engine type, so live traces (and their existing assertions) stay as they are; `RoutingInspectionTraceEntry` makes it required on the inspector's answer. Two new pure domain files hold the failed-condition and not-evaluated logic (`getFailedRoutingConditions.ts`, `listNotEvaluatedTrace.ts`), which the contract's file list does not name.
- R289 says the inspector "evaluates every condition of every rule (including requester teams and the folder chain)". The plan evaluates every condition of every rule up to the deciding one; the rules after it are `notEvaluated` by the same ruling and are not evaluated. The folder chain is read for a folder condition of the target folder's type only (another type fails the folder condition on its own).
- `candidateIds` are the strategy's order before read access is checked, so a candidate who cannot read is listed and also appears in `skipped`; the design sentence "{Name} is next in rotation" is composed by the editor from this order (Task 13).
- The CMS and WB schema factories and wrappers need no source change: both reuse the shared `WorkflowsRoutingInspection` type and return the engine's inspection unchanged, so only their tests and the WB test helper's selection change.

## Review fixes (sub-phase review)

- The two `trace.push(...listNotEvaluatedTrace(...))` calls passed a call result straight into another call (no nested call arguments); each now names the list first (`const notEvaluated = ...`, then `trace.push(...notEvaluated)`).
- Checked, no change needed: every `Before` hunk of the evaluator, types, schema and the five CMS and WB test files applies to the current text; live lookup counts are identical (the chain read now also requires the folder type to match, which every live rule that reaches it already satisfies); the SEC id that the old inspector comment carried is dropped by the full replacement of `InspectRoutingUseCase.ts`.
