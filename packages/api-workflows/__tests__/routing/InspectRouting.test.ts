import { beforeEach, describe, expect, it } from "vitest";
import { hasErrorSource } from "~/domain/hasErrorSource.js";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import {
    createRoutingContext,
    LEGAL_TEAM_ID,
    resetRoutingFakes,
    ROUTING_USERS
} from "~tests/__helpers/routingContext.js";
import { FakeListUsers } from "~tests/__helpers/FakeListUsers.js";
import {
    readableUsers,
    readChecks,
    throwingReadChecks
} from "~tests/__helpers/FakeReviewTargetReadAccess.js";
import {
    ARTICLE_MODEL,
    NOW,
    OTHER_TEAM_ID,
    requester,
    REVIEW_TEAM_ID,
    targetContext
} from "~tests/__helpers/fixtures.js";
import { InspectRoutingUseCase } from "~/features/routing/InspectRouting/index.js";

const userRule = (id: string, userId: string) => {
    return { id, conditions: {}, target: { type: "user", id: userId } };
};

const stepConfig = (rules: unknown[] = []) => {
    return {
        teams: [REVIEW_TEAM_ID],
        assignment: { strategy: "none", allowManualPick: false, rules }
    };
};

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

describe("InspectRoutingUseCase (D45, D118, R121)", () => {
    beforeEach(() => {
        resetRoutingFakes();
    });

    it("evaluates unsaved rules with folder-level read checks and returns the trace", async () => {
        const { inspect } = await setup();
        readableUsers.add("user-anna");

        const result = await inspect.execute({
            stepConfig: stepConfig([
                userRule("rule-dan", "user-dan"),
                userRule("rule-anna", "user-anna")
            ]),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: targetContext.folder,
            now: new Date(NOW)
        });

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({
            owner: { id: "user-anna", displayName: "Anna" },
            source: "rule",
            ruleId: "rule-anna",
            strategy: "none",
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
        expect(readChecks).toEqual([
            {
                userId: "user-anna",
                scope: "folder",
                targetRevisionId: null,
                folderId: "folder-1",
                authorizationEnabled: true
            }
        ]);
    });

    it("shows an excluded target's own reason to the editor, and the fixed one without it (R129, D118)", async () => {
        const { inspect, settings } = await setup();
        readableUsers.add("user-anna");
        readableUsers.add("user-bob");
        settings.exclusions = [{ userId: "user-anna", reason: "On leave" }, { userId: "user-bob" }];

        const result = await inspect.execute({
            stepConfig: stepConfig([
                userRule("rule-anna", "user-anna"),
                userRule("rule-bob", "user-bob")
            ]),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: targetContext.folder,
            now: new Date(NOW)
        });

        expect(result.value).toEqual({
            owner: null,
            source: "pool",
            ruleId: null,
            strategy: "none",
            trace: [
                {
                    ruleId: "rule-anna",
                    outcome: "skipped",
                    reason: "On leave",
                    failedConditions: []
                },
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
        // The records keep the fixed reason (D89, D97); the inspection returns no records (D104).
        expect(result.value).not.toHaveProperty("records");
    });

    it("checks the model only for a target in the root folder", async () => {
        const { inspect } = await setup();
        readableUsers.add("user-anna");

        await inspect.execute({
            stepConfig: stepConfig([userRule("rule-anna", "user-anna")]),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: null,
            now: new Date(NOW)
        });

        expect(readChecks).toMatchObject([
            { userId: "user-anna", scope: "folder", folderId: null }
        ]);
    });

    it("returns the pool without rules or strategy", async () => {
        const { inspect } = await setup();

        const result = await inspect.execute({
            stepConfig: stepConfig(),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: targetContext.folder,
            now: new Date(NOW)
        });

        expect(result.value).toEqual({
            owner: null,
            source: "pool",
            ruleId: null,
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
        // Every rule's user target is checked up front, in one adapter call (Q79).
        expect(readChecks.map(call => call.userId)).toEqual(["user-anna", "user-bob"]);
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
            stepConfig: strategyConfig(
                "roundRobin",
                [teamRule("rule-legal", LEGAL_TEAM_ID)],
                [REVIEW_TEAM_ID, LEGAL_TEAM_ID]
            ),
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
        expect(result.value.skipped.map(item => item.userId)).toEqual([requester.id, "user-anna"]);
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

    it("refuses a team target outside the step's teams, as save does, before any lookup", async () => {
        const { inspect, users } = await setup();

        const result = await inspect.execute({
            stepConfig: stepConfig([
                { id: "rule-legal", conditions: {}, target: { type: "team", id: "team-legal" } }
            ]),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: null,
            now: new Date(NOW)
        });

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            "The target team is not one of the step's reviewing teams."
        );
        expect(result.error.data).toEqual({
            stepId: null,
            field: "config.assignment.rules.target",
            workflowId: null,
            ruleId: "rule-legal"
        });
        expect(users.calls).toEqual([]);
    });

    it("refuses two rules with the same id, as save does, before any lookup", async () => {
        const { inspect, users } = await setup();

        const result = await inspect.execute({
            stepConfig: stepConfig([
                userRule("rule-anna", "user-anna"),
                userRule("rule-anna", "user-anna")
            ]),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: null,
            now: new Date(NOW)
        });

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe('Two routing rules have the same ID "rule-anna".');
        expect(result.error.data).toEqual({
            stepId: null,
            field: "config.assignment.rules",
            workflowId: null,
            ruleId: null
        });
        expect(users.calls).toEqual([]);
    });

    it("refuses a rule without a target with the shared message, the rule field and the rule id, before any lookup", async () => {
        const { inspect, users } = await setup();

        const result = await inspect.execute({
            stepConfig: stepConfig([
                userRule("rule-anna", "user-anna"),
                { id: "rule-open", conditions: {} }
            ]),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: null,
            now: new Date(NOW)
        });

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe("Every routing rule needs a target.");
        expect(result.error.data).toEqual({
            stepId: null,
            field: "config.assignment.rules.target",
            workflowId: null,
            ruleId: "rule-open"
        });
        expect(users.calls).toEqual([]);
        expect(readChecks).toEqual([]);
    });

    it("keeps the schema message and an all-null error data for a schema failure", async () => {
        const { inspect } = await setup();

        const result = await inspect.execute({
            stepConfig: stepConfig(["nope"]),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: null,
            now: new Date(NOW)
        });

        expect(result.error.message).toMatch(/^The step configuration is invalid: /);
        expect(result.error.data).toEqual({
            stepId: null,
            field: null,
            workflowId: null,
            ruleId: null
        });
    });

    it("refuses a step without teams, as save does, before any lookup or read check", async () => {
        const { inspect, users } = await setup();

        const result = await inspect.execute({
            stepConfig: { ...stepConfig([userRule("rule-anna", "user-anna")]), teams: [] },
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: null,
            now: new Date(NOW)
        });

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            "The step configuration is invalid: the step needs at least one team."
        );
        expect(users.calls).toEqual([]);
        expect(readChecks).toEqual([]);
    });

    it("refuses an invalid step config before any lookup", async () => {
        const { inspect, users } = await setup();

        const result = await inspect.execute({
            stepConfig: { teams: [REVIEW_TEAM_ID], assignment: { strategy: "fastest" } },
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: null,
            now: new Date(NOW)
        });

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toMatch(/^The step configuration is invalid: /);
        expect(users.calls).toEqual([]);
        expect(readChecks).toEqual([]);
    });

    it("returns the routing dependency error when a lookup fails or a read check throws", async () => {
        const { inspect, users } = await setup();
        throwingReadChecks.add("user-anna");
        const input = {
            stepConfig: stepConfig([userRule("rule-anna", "user-anna")]),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: targetContext.folder,
            now: new Date(NOW)
        };

        users.failuresLeft = 1;
        const failed = await inspect.execute(input);
        const thrown = await inspect.execute(input);

        expect(failed.error.code).toBe("Workflows/Routing/Dependency");
        expect(hasErrorSource(failed.error) && failed.error.source.message).toBe(
            "Storage is not available."
        );
        expect(thrown.error.code).toBe("Workflows/Routing/Dependency");
        expect(hasErrorSource(thrown.error) && thrown.error.source.message).toBe(
            "The read check crashed."
        );
    });
});
