import { beforeEach, describe, expect, it } from "vitest";
import { createRoutingContext, resetRoutingFakes } from "~tests/__helpers/routingContext.js";
import {
    readableUsers,
    readChecks,
    throwingReadChecks
} from "~tests/__helpers/FakeReviewTargetReadAccess.js";
import {
    ARTICLE_MODEL,
    NOW,
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

const setup = async () => {
    const routing = await createRoutingContext();
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
                { ruleId: "rule-anna", outcome: "skipped", reason: "On leave" },
                { ruleId: "rule-bob", outcome: "skipped", reason: "Excluded from reviews." }
            ],
            skipped: [
                { userId: "user-anna", displayName: "Anna", reason: "On leave" },
                { userId: "user-bob", displayName: "Bob", reason: "Excluded from reviews." }
            ]
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
            skipped: []
        });
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
        expect(failed.error.message).toBe("Storage is not available.");
        expect(thrown.error.code).toBe("Workflows/Routing/Dependency");
        expect(thrown.error.message).toBe("The read check crashed.");
    });
});
