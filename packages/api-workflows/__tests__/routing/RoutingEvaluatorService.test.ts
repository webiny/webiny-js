import { beforeEach, describe, expect, it } from "vitest";
import { hasErrorSource } from "~/domain/hasErrorSource.js";
import { Result } from "@webiny/feature/api";
import {
    ARTICLE_MODEL,
    NOW,
    requester,
    REVIEW_TEAM_ID,
    targetContext
} from "~tests/__helpers/fixtures.js";
import {
    createRoutingContext,
    LEGAL_TEAM_ID,
    resetRoutingFakes
} from "~tests/__helpers/routingContext.js";
import {
    readableUsers,
    readChecks,
    throwingReadChecks
} from "~tests/__helpers/FakeReviewTargetReadAccess.js";
import {
    folderChainCalls,
    folderChainFaults,
    folderChains
} from "~tests/__helpers/FakeReviewTargetFolderChain.js";
import type { AssignmentDecision } from "~/domain/assignment/types.js";
import type {
    ReviewStepAssignmentConfig,
    ReviewStepConfig,
    RoutingRule
} from "~/domain/workflow/types.js";
import type { RoutingEvaluateParams } from "~/domain/routing/types.js";
import {
    ROUTING_NO_CANDIDATE_REASON,
    ROUTING_SKIP_REASONS,
    ROUTING_TEAM_TARGET_SKIP_REASON
} from "~/domain/routing/reasons.js";
import { RoutingDependencyError } from "~/domain/routing/errors.js";
import { RoutingEvaluatorService } from "~/features/routing/RoutingEvaluatorService/index.js";
import { RoutingStrategyService } from "~/features/routing/RoutingStrategyService/index.js";
import { TEST_WB_PAGE_MODEL_ID } from "~tests/__helpers/TestWorkflowModelParser.js";

const ANNA = { id: "user-anna", displayName: "Anna" };
const BOB = { id: "user-bob", displayName: "Bob" };
const CARA = { id: "user-cara", displayName: "Cara" };
const TARGET_READ = {
    type: "target" as const,
    targetId: "article-1",
    targetRevisionId: "article-1#0001"
};

const stepConfig = (assignment: Partial<ReviewStepAssignmentConfig> = {}): ReviewStepConfig => {
    return {
        teams: [REVIEW_TEAM_ID],
        assignment: { strategy: "none", allowManualPick: true, rules: [], ...assignment }
    };
};

const evaluateParams = (overrides: Partial<RoutingEvaluateParams> = {}): RoutingEvaluateParams => {
    return {
        config: stepConfig(),
        model: ARTICLE_MODEL,
        workflowId: "workflow-1",
        reviewId: "review-1",
        stepId: "legal",
        requesterId: requester.id,
        pickedUserId: null,
        folder: targetContext.folder,
        read: TARGET_READ,
        now: new Date(NOW),
        ...overrides
    };
};

const userRule = (id: string, userId: string, conditions: RoutingRule["conditions"] = {}) => {
    return { id, conditions, target: { type: "user" as const, id: userId } };
};

const teamRule = (id: string, teamId: string, conditions: RoutingRule["conditions"] = {}) => {
    return { id, conditions, target: { type: "team" as const, id: teamId } };
};

const skip = (
    userId: string,
    source: AssignmentDecision["source"],
    reason: string,
    ruleId: string | null = null
): AssignmentDecision => {
    return { kind: "skip", userId, source, ruleId, by: null, reason };
};

const outcome = (
    userId: string | null,
    source: AssignmentDecision["source"],
    ruleId: string | null = null,
    reason: string | null = null
): AssignmentDecision => {
    return { kind: "outcome", userId, source, ruleId, by: null, reason };
};

class FailingRoutingStrategyImpl implements RoutingStrategyService.Interface {
    public async order(): RoutingStrategyService.Return {
        return Result.fail(new RoutingDependencyError(new Error("Storage is down.")));
    }
}

const FailingRoutingStrategy = RoutingStrategyService.createImplementation({
    implementation: FailingRoutingStrategyImpl,
    dependencies: []
});

interface EvaluatorContextOptions {
    failStrategy?: boolean;
}

const createEvaluatorContext = async (options: EvaluatorContextOptions = {}) => {
    const routing = await createRoutingContext({
        setup: container => {
            if (options.failStrategy) {
                container.register(FailingRoutingStrategy);
            }
        }
    });
    return {
        ...routing,
        evaluator: routing.context.container.resolve(RoutingEvaluatorService)
    };
};

describe("RoutingEvaluatorService.evaluate: pick", () => {
    beforeEach(() => {
        resetRoutingFakes();
    });

    it("gives the step to a valid pick", async () => {
        const { evaluator, users } = await createEvaluatorContext();
        readableUsers.add(BOB.id);

        const result = await evaluator.evaluate(evaluateParams({ pickedUserId: BOB.id }));

        expect(result.value).toEqual({
            owner: BOB,
            source: "picked",
            ruleId: null,
            strategy: "none",
            candidateTeamIds: [REVIEW_TEAM_ID],
            reason: null,
            records: [outcome(BOB.id, "picked")],
            trace: [],
            skipped: []
        });
        expect(users.calls.map(call => call.input)).toEqual([
            { where: { teams_in: [REVIEW_TEAM_ID] } }
        ]);
        expect(readChecks).toMatchObject([
            { userId: BOB.id, scope: "target", targetRevisionId: "article-1#0001" }
        ]);
    });

    it("ignores the pick when the step does not allow picks, without reading users", async () => {
        const { evaluator, users, settings } = await createEvaluatorContext();
        readableUsers.add(BOB.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                config: stepConfig({ allowManualPick: false }),
                pickedUserId: BOB.id
            })
        );

        expect(result.value).toMatchObject({
            owner: null,
            source: "pool",
            records: [outcome(null, "pool")]
        });
        expect(users.calls).toEqual([]);
        expect(settings.inputs).toEqual([]);
        expect(readChecks).toEqual([]);
    });

    it.each([
        ["the requester", requester.id, ROUTING_SKIP_REASONS.requester],
        ["a user outside the step's teams", "user-dan", ROUTING_SKIP_REASONS.notMember],
        ["an excluded user", ANNA.id, ROUTING_SKIP_REASONS.excluded],
        ["a user who cannot read the content", BOB.id, ROUTING_SKIP_REASONS.cannotRead]
    ])("skips a pick of %s with a fixed reason and goes on", async (_label, userId, reason) => {
        const { evaluator, settings } = await createEvaluatorContext();
        settings.exclusions = [{ userId: ANNA.id, reason: "On leave until May" }];
        readableUsers.add(ANNA.id);
        readableUsers.add(requester.id);
        readableUsers.add("user-dan");

        const result = await evaluator.evaluate(evaluateParams({ pickedUserId: userId }));

        expect(result.value).toMatchObject({
            owner: null,
            source: "pool",
            records: [skip(userId, "picked", reason), outcome(null, "pool")]
        });
        // An exclusion's own reason never reaches a record (D89, D97); only the inspector's
        // `skipped` list shows it (R129).
        expect(JSON.stringify(result.value?.records)).not.toContain("On leave");
        expect(result.value?.skipped).toMatchObject([
            { userId, reason: userId === ANNA.id ? "On leave until May" : reason }
        ]);
    });

    it("reads exclusions with the expired ones and treats an expired one as no exclusion", async () => {
        const { evaluator, settings } = await createEvaluatorContext();
        settings.exclusions = [{ userId: ANNA.id, endsOn: "2026-10-01T00:00:00.000Z" }];
        readableUsers.add(ANNA.id);

        const result = await evaluator.evaluate(evaluateParams({ pickedUserId: ANNA.id }));

        expect(result.value?.owner).toEqual(ANNA);
        expect(settings.inputs).toEqual([{ includeExpired: true }]);
    });

    it("answers no access when no read check matches the namespace", async () => {
        const { evaluator } = await createEvaluatorContext();
        readableUsers.add(BOB.id);

        const result = await evaluator.evaluate(
            evaluateParams({ model: "cms.other", pickedUserId: BOB.id })
        );

        expect(result.value?.records).toEqual([
            skip(BOB.id, "picked", ROUTING_SKIP_REASONS.cannotRead),
            outcome(null, "pool")
        ]);
        expect(readChecks).toEqual([]);
    });

    it("asks the folder-level read check when there is no target revision", async () => {
        const { evaluator } = await createEvaluatorContext();
        readableUsers.add(BOB.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                pickedUserId: BOB.id,
                read: { type: "folder", folderId: "folder-1" }
            })
        );

        expect(result.value?.owner).toEqual(BOB);
        expect(readChecks).toMatchObject([
            { userId: BOB.id, scope: "folder", folderId: "folder-1" }
        ]);
    });

    it("reads users as the system and checks read access as the request identity", async () => {
        const { evaluator, users } = await createEvaluatorContext();
        readableUsers.add(BOB.id);

        await evaluator.evaluate(evaluateParams({ pickedUserId: BOB.id }));

        expect(users.calls.map(call => call.authorizationEnabled)).toEqual([false]);
        expect(readChecks.map(call => call.authorizationEnabled)).toEqual([true]);
    });
});

describe("RoutingEvaluatorService.evaluate: rules", () => {
    beforeEach(() => {
        resetRoutingFakes();
    });

    it("matches a model id condition against the id the model's app parses (R113)", async () => {
        const { evaluator } = await createEvaluatorContext();

        const result = await evaluator.evaluate(
            evaluateParams({
                model: "wb.page",
                folder: null,
                config: stepConfig({
                    rules: [
                        teamRule("rule-page", REVIEW_TEAM_ID, { modelId: "page" }),
                        teamRule("rule-wb", REVIEW_TEAM_ID, { modelId: TEST_WB_PAGE_MODEL_ID })
                    ]
                })
            })
        );

        expect(result.value?.trace).toEqual([
            { ruleId: "rule-page", outcome: "notMatched", reason: null },
            { ruleId: "rule-wb", outcome: "matched", reason: null }
        ]);
    });

    it("matches no model id condition when no app knows the model", async () => {
        const { evaluator } = await createEvaluatorContext();

        const result = await evaluator.evaluate(
            evaluateParams({
                model: "blog.post",
                folder: null,
                config: stepConfig({
                    rules: [teamRule("rule-post", REVIEW_TEAM_ID, { modelId: "post" })]
                })
            })
        );

        expect(result.value?.trace).toEqual([
            { ruleId: "rule-post", outcome: "notMatched", reason: null }
        ]);
    });

    it("takes the first rule whose conditions match and whose target is valid", async () => {
        const { evaluator, teams } = await createEvaluatorContext();
        readableUsers.add(CARA.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                config: stepConfig({
                    rules: [
                        userRule("rule-1", BOB.id, { requesterUserId: "user-someone" }),
                        userRule("rule-2", "user-dan", { modelId: "article" }),
                        userRule("rule-3", CARA.id, { requesterTeamId: "team-other" })
                    ]
                })
            })
        );

        expect(result.value).toEqual({
            owner: CARA,
            source: "rule",
            ruleId: "rule-3",
            strategy: "none",
            candidateTeamIds: [REVIEW_TEAM_ID],
            reason: null,
            records: [
                skip("user-dan", "rule", ROUTING_SKIP_REASONS.notMember, "rule-2"),
                outcome(CARA.id, "rule", "rule-3")
            ],
            trace: [
                { ruleId: "rule-1", outcome: "notMatched", reason: null },
                {
                    ruleId: "rule-2",
                    outcome: "skipped",
                    reason: ROUTING_SKIP_REASONS.notMember
                },
                { ruleId: "rule-3", outcome: "matched", reason: null }
            ],
            skipped: [
                { userId: "user-dan", displayName: null, reason: ROUTING_SKIP_REASONS.notMember }
            ]
        });
        // Read lazily: the team lookup runs when rule 3 is reached, once.
        expect(teams.calls).toEqual([requester.id]);
    });

    it("shows an excluded rule target's own reason in the trace, never in the record (R129)", async () => {
        const { evaluator, settings } = await createEvaluatorContext();
        settings.exclusions = [
            { userId: ANNA.id, reason: "On leave until May" },
            { userId: BOB.id }
        ];
        readableUsers.add(ANNA.id);
        readableUsers.add(BOB.id);
        readableUsers.add(CARA.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                config: stepConfig({
                    rules: [
                        userRule("rule-anna", ANNA.id),
                        userRule("rule-bob", BOB.id),
                        userRule("rule-cara", CARA.id)
                    ]
                })
            })
        );

        expect(result.value).toMatchObject({
            owner: CARA,
            ruleId: "rule-cara",
            records: [
                skip(ANNA.id, "rule", ROUTING_SKIP_REASONS.excluded, "rule-anna"),
                skip(BOB.id, "rule", ROUTING_SKIP_REASONS.excluded, "rule-bob"),
                outcome(CARA.id, "rule", "rule-cara")
            ],
            trace: [
                { ruleId: "rule-anna", outcome: "skipped", reason: "On leave until May" },
                { ruleId: "rule-bob", outcome: "skipped", reason: ROUTING_SKIP_REASONS.excluded },
                { ruleId: "rule-cara", outcome: "matched", reason: null }
            ],
            skipped: [
                { userId: ANNA.id, displayName: "Anna", reason: "On leave until May" },
                { userId: BOB.id, displayName: "Bob", reason: ROUTING_SKIP_REASONS.excluded }
            ]
        });
        expect(JSON.stringify(result.value?.records)).not.toContain("On leave");
    });

    it("matches no requester team rule for a requester without teams, such as an API key (R113)", async () => {
        const { evaluator, teams } = await createEvaluatorContext();
        readableUsers.add(BOB.id);
        readableUsers.add(CARA.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                requesterId: "api-key-1",
                config: stepConfig({
                    rules: [
                        userRule("rule-team", BOB.id, { requesterTeamId: "team-other" }),
                        userRule("rule-any", CARA.id)
                    ]
                })
            })
        );

        expect(result.value).toMatchObject({
            owner: CARA,
            ruleId: "rule-any",
            trace: [
                { ruleId: "rule-team", outcome: "notMatched", reason: null },
                { ruleId: "rule-any", outcome: "matched", reason: null }
            ]
        });
        expect(teams.calls).toEqual(["api-key-1"]);
    });

    it("prefers a valid pick over the rules", async () => {
        const { evaluator } = await createEvaluatorContext();
        readableUsers.add(BOB.id);
        readableUsers.add(CARA.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                pickedUserId: BOB.id,
                config: stepConfig({ rules: [userRule("rule-1", CARA.id)] })
            })
        );

        expect(result.value).toMatchObject({ owner: BOB, source: "picked", trace: [] });
    });

    it("skips a rule user target who cannot read and takes the next rule", async () => {
        const { evaluator } = await createEvaluatorContext();
        readableUsers.add(CARA.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                config: stepConfig({
                    rules: [userRule("rule-1", BOB.id), userRule("rule-2", CARA.id)]
                })
            })
        );

        expect(result.value).toMatchObject({
            owner: CARA,
            ruleId: "rule-2",
            records: [
                skip(BOB.id, "rule", ROUTING_SKIP_REASONS.cannotRead, "rule-1"),
                outcome(CARA.id, "rule", "rule-2")
            ],
            trace: [
                { ruleId: "rule-1", outcome: "skipped", reason: ROUTING_SKIP_REASONS.cannotRead },
                { ruleId: "rule-2", outcome: "matched", reason: null }
            ]
        });
    });

    it("narrows the pool to a team target when the step has no strategy", async () => {
        const { evaluator, users } = await createEvaluatorContext();

        const result = await evaluator.evaluate(
            evaluateParams({
                config: {
                    ...stepConfig({ rules: [teamRule("rule-legal", LEGAL_TEAM_ID)] }),
                    teams: [REVIEW_TEAM_ID, LEGAL_TEAM_ID]
                }
            })
        );

        expect(result.value).toEqual({
            owner: null,
            source: "pool",
            ruleId: "rule-legal",
            strategy: "none",
            candidateTeamIds: [LEGAL_TEAM_ID],
            reason: null,
            records: [outcome(null, "pool", "rule-legal")],
            trace: [{ ruleId: "rule-legal", outcome: "matched", reason: null }],
            skipped: []
        });
        expect(users.calls).toEqual([]);
    });

    it("matches folder rules on the target folder and its ancestors from the folder port", async () => {
        const { evaluator } = await createEvaluatorContext();
        folderChains.set("folder-1", ["folder-1", "folder-parent"]);
        readableUsers.add(BOB.id);
        readableUsers.add(CARA.id);
        const parent = { id: "folder-parent", type: "cms:article" };

        const result = await evaluator.evaluate(
            evaluateParams({
                config: stepConfig({
                    rules: [
                        userRule("rule-exact", CARA.id, {
                            folder: { ...parent, includeDescendants: false }
                        }),
                        userRule("rule-tree", BOB.id, {
                            folder: { ...parent, includeDescendants: true }
                        })
                    ]
                })
            })
        );

        expect(result.value).toMatchObject({ owner: BOB, ruleId: "rule-tree" });
        expect(folderChainCalls).toEqual([{ model: ARTICLE_MODEL, folderId: "folder-1" }]);
    });

    it("never matches a folder rule for a target in the root and does not ask the folder port", async () => {
        const { evaluator } = await createEvaluatorContext();
        readableUsers.add(BOB.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                folder: null,
                config: stepConfig({
                    rules: [
                        userRule("rule-tree", BOB.id, {
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

        expect(result.value).toMatchObject({
            owner: null,
            source: "pool",
            trace: [{ ruleId: "rule-tree", outcome: "notMatched", reason: null }]
        });
        expect(folderChainCalls).toEqual([]);
    });

    it("fails when a folder rule needs a folder chain and no port handles the namespace", async () => {
        const { evaluator } = await createEvaluatorContext();

        const result = await evaluator.evaluate(
            evaluateParams({
                model: "wb.page",
                folder: { id: "folder-1", type: "wb:page" },
                config: stepConfig({
                    rules: [
                        userRule("rule-tree", BOB.id, {
                            folder: { id: "folder-1", type: "wb:page", includeDescendants: true }
                        })
                    ]
                })
            })
        );

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Routing/Dependency");
    });

    it("skips a team target outside the step's teams and lets the strategy decide (spec 6)", async () => {
        const { evaluator } = await createEvaluatorContext();
        readableUsers.add(ANNA.id);

        // Unsaved config, as the inspector sends it: save-time validation has not run.
        const result = await evaluator.evaluate(
            evaluateParams({
                config: stepConfig({
                    strategy: "roundRobin",
                    rules: [teamRule("rule-legal", LEGAL_TEAM_ID)]
                })
            })
        );

        expect(result.value).toEqual({
            owner: ANNA,
            source: "roundRobin",
            ruleId: null,
            strategy: "roundRobin",
            candidateTeamIds: [REVIEW_TEAM_ID],
            reason: null,
            records: [
                {
                    kind: "skip",
                    userId: null,
                    source: "rule",
                    ruleId: "rule-legal",
                    by: null,
                    reason: ROUTING_TEAM_TARGET_SKIP_REASON
                },
                skip(requester.id, "roundRobin", ROUTING_SKIP_REASONS.requester),
                outcome(ANNA.id, "roundRobin")
            ],
            trace: [
                {
                    ruleId: "rule-legal",
                    outcome: "skipped",
                    reason: ROUTING_TEAM_TARGET_SKIP_REASON
                }
            ],
            skipped: [
                {
                    userId: requester.id,
                    displayName: requester.displayName,
                    reason: ROUTING_SKIP_REASONS.requester
                }
            ]
        });
    });

    it("skips an invalid team target and goes to the pool without a strategy", async () => {
        const { evaluator } = await createEvaluatorContext();

        const result = await evaluator.evaluate(
            evaluateParams({
                config: stepConfig({ rules: [teamRule("rule-legal", LEGAL_TEAM_ID)] })
            })
        );

        expect(result.value).toMatchObject({
            owner: null,
            source: "pool",
            ruleId: null,
            candidateTeamIds: [REVIEW_TEAM_ID],
            records: [{ kind: "skip", userId: null, ruleId: "rule-legal" }, outcome(null, "pool")]
        });
    });

    it("checks the requester, the model and the folder type before reading teams or folders", async () => {
        const { evaluator, teams } = await createEvaluatorContext();
        const folder = { id: "folder-1", type: "cms:article", includeDescendants: true };

        const result = await evaluator.evaluate(
            evaluateParams({
                config: stepConfig({
                    rules: [
                        teamRule("rule-user", REVIEW_TEAM_ID, {
                            requesterUserId: "user-someone",
                            requesterTeamId: "team-other",
                            folder
                        }),
                        teamRule("rule-model", REVIEW_TEAM_ID, {
                            modelId: "blog",
                            requesterTeamId: "team-other",
                            folder
                        }),
                        teamRule("rule-type", REVIEW_TEAM_ID, {
                            requesterTeamId: "team-other",
                            folder: { ...folder, type: "cms:blog" }
                        })
                    ]
                })
            })
        );

        expect(result.value).toMatchObject({
            source: "pool",
            trace: [
                { ruleId: "rule-user", outcome: "notMatched" },
                { ruleId: "rule-model", outcome: "notMatched" },
                { ruleId: "rule-type", outcome: "notMatched" }
            ]
        });
        expect(teams.calls).toEqual([]);
        expect(folderChainCalls).toEqual([]);
    });

    it("reads the requester's teams and the folder chain at most once", async () => {
        const { evaluator, teams } = await createEvaluatorContext();
        const folder = { id: "folder-1", type: "cms:article", includeDescendants: true };

        await evaluator.evaluate(
            evaluateParams({
                config: stepConfig({
                    rules: [
                        teamRule("rule-1", REVIEW_TEAM_ID, { requesterTeamId: "team-x", folder }),
                        teamRule("rule-2", REVIEW_TEAM_ID, { requesterTeamId: "team-y", folder })
                    ]
                })
            })
        );

        expect(teams.calls).toEqual([requester.id]);
        expect(folderChainCalls).toHaveLength(1);
    });

    it("keeps the skips gathered so far when the folder port throws (R116)", async () => {
        const { evaluator } = await createEvaluatorContext();
        folderChainFaults.throwNext = true;

        const result = await evaluator.evaluate(
            evaluateParams({
                pickedUserId: "user-dan",
                config: stepConfig({
                    rules: [
                        userRule("rule-tree", BOB.id, {
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

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Routing/Dependency");
        expect(result.error.decided).toEqual({
            candidateTeamIds: [REVIEW_TEAM_ID],
            ruleId: null,
            skips: [skip("user-dan", "picked", ROUTING_SKIP_REASONS.notMember)]
        });
    });

    it("keeps the narrowed teams and the rule when the strategy fails (R116)", async () => {
        const { evaluator } = await createEvaluatorContext({ failStrategy: true });

        const result = await evaluator.evaluate(
            evaluateParams({
                config: {
                    ...stepConfig({
                        strategy: "leastLoaded",
                        rules: [
                            userRule("rule-dan", "user-dan"),
                            teamRule("rule-legal", LEGAL_TEAM_ID)
                        ]
                    }),
                    teams: [REVIEW_TEAM_ID, LEGAL_TEAM_ID]
                }
            })
        );

        expect(result.isFail()).toBe(true);
        expect(result.error.decided).toEqual({
            candidateTeamIds: [LEGAL_TEAM_ID],
            ruleId: "rule-legal",
            skips: [skip("user-dan", "rule", ROUTING_SKIP_REASONS.notMember, "rule-dan")]
        });
    });

    it("continues from an invalid pick to a matching rule or the strategy", async () => {
        const { evaluator } = await createEvaluatorContext();
        readableUsers.add(ANNA.id);
        readableUsers.add(CARA.id);

        const toRule = await evaluator.evaluate(
            evaluateParams({
                pickedUserId: "user-dan",
                config: stepConfig({ rules: [userRule("rule-cara", CARA.id)] })
            })
        );
        const toStrategy = await evaluator.evaluate(
            evaluateParams({
                pickedUserId: "user-dan",
                config: stepConfig({ strategy: "roundRobin" })
            })
        );

        expect(toRule.value).toMatchObject({
            owner: CARA,
            source: "rule",
            records: [
                skip("user-dan", "picked", ROUTING_SKIP_REASONS.notMember),
                outcome(CARA.id, "rule", "rule-cara")
            ]
        });
        expect(toStrategy.value).toMatchObject({
            owner: ANNA,
            source: "roundRobin",
            records: [
                skip("user-dan", "picked", ROUTING_SKIP_REASONS.notMember),
                skip(requester.id, "roundRobin", ROUTING_SKIP_REASONS.requester),
                outcome(ANNA.id, "roundRobin")
            ]
        });
    });

    it("checks rule targets and strategy candidates as the request identity", async () => {
        const { evaluator, users } = await createEvaluatorContext();
        readableUsers.add(BOB.id);

        const ruled = await evaluator.evaluate(
            evaluateParams({ config: stepConfig({ rules: [userRule("rule-bob", BOB.id)] }) })
        );
        const ruleChecks = readChecks.map(call => call.authorizationEnabled);
        readChecks.length = 0;
        const ordered = await evaluator.evaluate(
            evaluateParams({ config: stepConfig({ strategy: "roundRobin" }) })
        );

        expect(ruled.value).toMatchObject({ owner: BOB, source: "rule" });
        expect(ordered.value).toMatchObject({ owner: BOB, source: "roundRobin" });
        expect(ruleChecks).toEqual([true]);
        // Anna is asked first and refused, then Bob.
        expect(readChecks.map(call => call.authorizationEnabled)).toEqual([true, true]);
        expect(users.calls.map(call => call.authorizationEnabled)).toEqual([false, false]);
    });

    it("treats a failed requester team lookup as no teams", async () => {
        const { evaluator, teams } = await createEvaluatorContext();
        teams.failuresLeft = 1;
        readableUsers.add(BOB.id);
        readableUsers.add(CARA.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                config: stepConfig({
                    rules: [
                        userRule("rule-team", BOB.id, { requesterTeamId: "team-other" }),
                        userRule("rule-any", CARA.id)
                    ]
                })
            })
        );

        expect(result.value).toMatchObject({ owner: CARA, ruleId: "rule-any" });
    });
});

describe("RoutingEvaluatorService.evaluate: strategy candidates", () => {
    beforeEach(() => {
        resetRoutingFakes();
    });

    it("never selects the requester, an excluded user or a user without read access", async () => {
        const { evaluator, settings } = await createEvaluatorContext();
        settings.exclusions = [{ userId: ANNA.id, reason: "On leave" }];
        readableUsers.add(ANNA.id);
        readableUsers.add(requester.id);
        readableUsers.add(CARA.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                pickedUserId: null,
                config: stepConfig({ strategy: "roundRobin" })
            })
        );

        expect(result.value).toEqual({
            owner: CARA,
            source: "roundRobin",
            ruleId: null,
            strategy: "roundRobin",
            candidateTeamIds: [REVIEW_TEAM_ID],
            reason: null,
            records: [
                skip(ANNA.id, "roundRobin", ROUTING_SKIP_REASONS.excluded),
                skip(requester.id, "roundRobin", ROUTING_SKIP_REASONS.requester),
                skip(BOB.id, "roundRobin", ROUTING_SKIP_REASONS.cannotRead),
                outcome(CARA.id, "roundRobin")
            ],
            trace: [],
            // The requester and the excluded are recorded as skipped by assignment (P2C-6).
            skipped: [
                { userId: ANNA.id, displayName: ANNA.displayName, reason: "On leave" },
                {
                    userId: requester.id,
                    displayName: requester.displayName,
                    reason: ROUTING_SKIP_REASONS.requester
                },
                {
                    userId: BOB.id,
                    displayName: BOB.displayName,
                    reason: ROUTING_SKIP_REASONS.cannotRead
                }
            ]
        });
        // Lazy: excluded users and the requester are never asked; asking stops at Cara.
        expect(readChecks.map(call => call.userId)).toEqual([BOB.id, CARA.id]);
    });

    it("records the requester and excluded team members as strategy skips", async () => {
        const { evaluator, settings } = await createEvaluatorContext();
        settings.exclusions = [{ userId: ANNA.id, reason: "On leave" }];
        readableUsers.add(BOB.id);

        const result = await evaluator.evaluate(
            evaluateParams({ config: stepConfig({ strategy: "roundRobin" }) })
        );

        expect(result.value).toMatchObject({ owner: BOB });
        expect(result.value.records).toEqual(
            expect.arrayContaining([
                skip(requester.id, "roundRobin", ROUTING_SKIP_REASONS.requester),
                skip(ANNA.id, "roundRobin", ROUTING_SKIP_REASONS.excluded)
            ])
        );
        expect(result.value.skipped).toContainEqual({
            userId: ANNA.id,
            displayName: ANNA.displayName,
            reason: "On leave"
        });
    });

    it("adds no strategy skips for a team-pool step", async () => {
        const { evaluator, settings } = await createEvaluatorContext();
        settings.exclusions = [{ userId: ANNA.id, reason: "On leave" }];

        const result = await evaluator.evaluate(evaluateParams());

        expect(result.value).toMatchObject({ owner: null, source: "pool", skipped: [] });
        expect(result.value.records.filter(record => record.kind === "skip")).toEqual([]);
    });

    it("records a requester who is also excluded once, as the requester", async () => {
        const { evaluator, settings } = await createEvaluatorContext();
        settings.exclusions = [{ userId: requester.id, reason: "Away" }];
        readableUsers.add(BOB.id);

        const result = await evaluator.evaluate(
            evaluateParams({ config: stepConfig({ strategy: "roundRobin" }) })
        );

        const requesterSkips = result.value.records.filter(
            record => record.kind === "skip" && record.userId === requester.id
        );
        expect(requesterSkips).toEqual([
            skip(requester.id, "roundRobin", ROUTING_SKIP_REASONS.requester)
        ]);
        expect(result.value.skipped.filter(item => item.userId === requester.id)).toHaveLength(1);
    });

    it("records a rule's requester target once, as the rule skip", async () => {
        const { evaluator } = await createEvaluatorContext();
        readableUsers.add(BOB.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                config: stepConfig({
                    strategy: "roundRobin",
                    rules: [userRule("rule-1", requester.id)]
                })
            })
        );

        const requesterSkips = result.value.records.filter(
            record => record.kind === "skip" && record.userId === requester.id
        );
        expect(requesterSkips).toEqual([
            skip(requester.id, "rule", ROUTING_SKIP_REASONS.requester, "rule-1")
        ]);
        expect(result.value.skipped.filter(item => item.userId === requester.id)).toHaveLength(1);
    });

    it("does not record a picked excluded user twice", async () => {
        const { evaluator, settings } = await createEvaluatorContext();
        settings.exclusions = [{ userId: ANNA.id, reason: "On leave" }];
        readableUsers.add(BOB.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                pickedUserId: ANNA.id,
                config: stepConfig({ strategy: "roundRobin" })
            })
        );

        const annaSkips = result.value.records.filter(
            record => record.kind === "skip" && record.userId === ANNA.id
        );
        expect(annaSkips).toEqual([skip(ANNA.id, "picked", ROUTING_SKIP_REASONS.excluded)]);
    });

    it("goes to the pool with a reason when no candidate can read", async () => {
        const { evaluator } = await createEvaluatorContext();

        const result = await evaluator.evaluate(
            evaluateParams({ config: stepConfig({ strategy: "leastLoaded" }) })
        );

        expect(result.value).toMatchObject({
            owner: null,
            source: "pool",
            strategy: "leastLoaded",
            reason: ROUTING_NO_CANDIDATE_REASON,
            records: [
                skip(requester.id, "leastLoaded", ROUTING_SKIP_REASONS.requester),
                skip(ANNA.id, "leastLoaded", ROUTING_SKIP_REASONS.cannotRead),
                skip(BOB.id, "leastLoaded", ROUTING_SKIP_REASONS.cannotRead),
                skip(CARA.id, "leastLoaded", ROUTING_SKIP_REASONS.cannotRead),
                outcome(null, "pool", null, ROUTING_NO_CANDIDATE_REASON)
            ]
        });
    });

    it("runs the strategy over a team target's members only", async () => {
        const { evaluator } = await createEvaluatorContext();
        readableUsers.add(ANNA.id);
        readableUsers.add(CARA.id);

        // Save-time validation needs a team target among the step's teams.
        const result = await evaluator.evaluate(
            evaluateParams({
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
            source: "roundRobin",
            ruleId: "rule-legal",
            candidateTeamIds: [LEGAL_TEAM_ID],
            records: [outcome(CARA.id, "roundRobin", "rule-legal")]
        });
    });

    it("fails when users or settings cannot be read", async () => {
        const { evaluator, users, settings } = await createEvaluatorContext();
        const params = evaluateParams({ config: stepConfig({ strategy: "roundRobin" }) });

        users.failuresLeft = 1;
        const usersFailed = await evaluator.evaluate(params);
        settings.failuresLeft = 1;
        const settingsFailed = await evaluator.evaluate(params);

        expect(usersFailed.error.code).toBe("Workflows/Routing/Dependency");
        expect(settingsFailed.error.code).toBe("Workflows/Routing/Dependency");
    });

    it("lets a throwing read check propagate to the caller", async () => {
        const { evaluator } = await createEvaluatorContext();
        throwingReadChecks.add(ANNA.id);

        await expect(
            evaluator.evaluate(evaluateParams({ config: stepConfig({ strategy: "roundRobin" }) }))
        ).rejects.toThrow("The read check crashed.");
    });
});

describe("RoutingEvaluatorService.evaluate: explain mode (R289)", () => {
    beforeEach(() => {
        resetRoutingFakes();
    });

    it("marks the rules after a deciding user rule not evaluated and assigns nothing for them", async () => {
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
        // Every rule's user target is checked up front, in one adapter call (Q79).
        expect(readChecks.map(call => call.userId)).toEqual([CARA.id, BOB.id]);
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
        expect(hasErrorSource(explained.error) && explained.error.source.message).toBe(
            "The folder read crashed."
        );
    });

    it("returns the strategy's order of the eligible candidates, also those who cannot read", async () => {
        const { evaluator } = await createEvaluatorContext();
        readableUsers.add(CARA.id);

        const result = await evaluator.evaluate(
            evaluateParams({ explain: true, config: stepConfig({ strategy: "roundRobin" }) })
        );

        expect(result.value).toMatchObject({ owner: CARA, source: "roundRobin" });
        expect(result.value.strategyOrder).toEqual([ANNA, BOB, CARA]);
        expect(result.value.skipped.map(item => item.userId)).toEqual([
            requester.id,
            ANNA.id,
            BOB.id
        ]);
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
        // The rule targets are checked once each, up front, in one adapter call (Q79).
        expect(readChecks.map(call => call.userId)).toEqual([BOB.id, CARA.id]);
    });
});

describe("RoutingEvaluatorService.listMembers and checkUser", () => {
    beforeEach(() => {
        resetRoutingFakes();
    });

    it("lists every member of the teams but the requester, by id, with exclusion and read access", async () => {
        const { evaluator, settings } = await createEvaluatorContext();
        settings.exclusions = [{ userId: ANNA.id, reason: "On leave" }];
        readableUsers.add(BOB.id);

        const result = await evaluator.listMembers({
            teamIds: [REVIEW_TEAM_ID],
            requesterId: requester.id,
            model: ARTICLE_MODEL,
            read: TARGET_READ,
            now: new Date(NOW)
        });

        expect(result.value).toEqual([
            {
                ...ANNA,
                teamIds: [REVIEW_TEAM_ID],
                exclusion: { userId: ANNA.id, reason: "On leave" },
                canRead: false
            },
            { ...BOB, teamIds: [REVIEW_TEAM_ID], exclusion: null, canRead: true },
            {
                ...CARA,
                teamIds: [REVIEW_TEAM_ID, LEGAL_TEAM_ID],
                exclusion: null,
                canRead: false
            }
        ]);
        expect(readChecks.map(call => call.userId)).toEqual([ANNA.id, BOB.id, CARA.id]);
    });

    it("fails listing members when users cannot be read", async () => {
        const { evaluator, users } = await createEvaluatorContext();
        users.failuresLeft = 1;

        const result = await evaluator.listMembers({
            teamIds: [REVIEW_TEAM_ID],
            requesterId: requester.id,
            model: ARTICLE_MODEL,
            read: TARGET_READ,
            now: new Date(NOW)
        });

        expect(result.error.code).toBe("Workflows/Routing/Dependency");
    });

    it("checks one user like a pick (R112)", async () => {
        const { evaluator, users, settings } = await createEvaluatorContext();
        settings.exclusions = [{ userId: ANNA.id }];
        readableUsers.add(ANNA.id);
        readableUsers.add(CARA.id);
        const check = (userId: string) => {
            return evaluator.checkUser({
                userId,
                teamIds: [REVIEW_TEAM_ID],
                requesterId: requester.id,
                model: ARTICLE_MODEL,
                read: TARGET_READ,
                now: new Date(NOW)
            });
        };

        expect((await check(CARA.id)).value).toEqual({ user: CARA, skipReason: null });
        expect((await check(requester.id)).value).toEqual({
            user: null,
            skipReason: ROUTING_SKIP_REASONS.requester
        });
        expect((await check("user-dan")).value).toEqual({
            user: null,
            skipReason: ROUTING_SKIP_REASONS.notMember
        });
        expect((await check(ANNA.id)).value).toEqual({
            user: ANNA,
            skipReason: ROUTING_SKIP_REASONS.excluded
        });
        expect((await check(BOB.id)).value).toEqual({
            user: BOB,
            skipReason: ROUTING_SKIP_REASONS.cannotRead
        });
        expect(users.calls[0]).toEqual({
            input: { where: { id_in: [CARA.id], teams_in: [REVIEW_TEAM_ID] } },
            authorizationEnabled: false
        });
        // The requester is refused without a lookup.
        expect(users.calls).toHaveLength(4);
    });
});
