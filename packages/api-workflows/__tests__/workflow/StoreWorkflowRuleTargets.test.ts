import { describe, expect, it } from "vitest";
import { hasErrorSource } from "~/domain/hasErrorSource.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
import { FakeListTeams } from "~tests/__helpers/FakeListTeams.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    createReviewStep,
    createWorkflowValues,
    editor,
    expectOk,
    OTHER_TEAM_ID,
    REVIEW_TEAM_ID
} from "~tests/__helpers/fixtures.js";
import { FakeListUsers, type FakeUser } from "~tests/__helpers/FakeListUsers.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import type { WorkflowValues } from "~/domain/workflow/types.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { GetWorkflowUseCase } from "~/features/workflow/GetWorkflow/index.js";

const MEMBER_ID = "user-member";
const SECOND_MEMBER_ID = "user-second-member";
const OUTSIDER_ID = "user-outsider";
const DELETED_ID = "user-deleted";

const USERS: FakeUser[] = [
    { id: MEMBER_ID, displayName: "Mia Member", teams: [REVIEW_TEAM_ID] },
    { id: SECOND_MEMBER_ID, displayName: "Sam Second", teams: [OTHER_TEAM_ID] },
    { id: OUTSIDER_ID, displayName: "Otto Outsider", teams: ["team-x"] }
];

/** Every user lookup throws, as a crashed storage driver does. */
class ThrowingListUsers implements ListUsersUseCase.Interface {
    public async execute(): ReturnType<ListUsersUseCase.Interface["execute"]> {
        throw new Error("Users are down.");
    }
}

const userRule = (id: string, userId: string) => {
    return { id, conditions: {}, target: { type: "user", id: userId } };
};

const teamRule = (id: string, teamId: string) => {
    return { id, conditions: {}, target: { type: "team", id: teamId } };
};

/** "legal" (team REVIEW_TEAM_ID) has `rules`; "editorial" (team OTHER_TEAM_ID) `editorialRules`. */
const createValues = (rules: unknown[], editorialRules: unknown[] = []): WorkflowValues => {
    return createWorkflowValues({
        steps: [
            createReviewStep({ id: "legal", title: "Legal review", rules }),
            createReviewStep({
                id: "editorial",
                title: "Editorial review",
                teams: [OTHER_TEAM_ID],
                rules: editorialRules
            })
        ]
    });
};

const setup = async (listUsers: ListUsersUseCase.Interface | null = null) => {
    const users = new FakeListUsers(USERS);
    const { context } = await createContextHandler({
        setup: container => {
            container.registerInstance(ListUsersUseCase, listUsers ?? users);
            // REVIEW_TEAM_ID and OTHER_TEAM_ID exist; any other team target is a deleted team.
            container.registerInstance(
                ListTeamsUseCase,
                new FakeListTeams([
                    { id: REVIEW_TEAM_ID, name: "Reviewers" },
                    { id: OTHER_TEAM_ID, name: "Other" }
                ])
            );
            container.registerDecorator(RecordingEventPublisher);
        }
    });
    users.watch(context.container.resolve(IdentityContext));
    const store = context.container.resolve(StoreWorkflowUseCase);
    recordedEvents.length = 0;
    return {
        users,
        storeWorkflow: {
            execute: (workflow: WorkflowValues, savedOn?: string) => {
                return store.execute({ workflow, savedOn, actor: editor });
            }
        },
        getWorkflow: context.container.resolve(GetWorkflowUseCase)
    };
};

describe("StoreWorkflowUseCase: rule user targets (spec 6, R122)", () => {
    it("stores user targets that are members of the step's teams, one lookup for every step, without authorization", async () => {
        const { storeWorkflow, users } = await setup();

        const stored = await storeWorkflow.execute(
            createValues(
                [
                    userRule("rule-1", MEMBER_ID),
                    teamRule("rule-2", REVIEW_TEAM_ID),
                    userRule("rule-3", MEMBER_ID)
                ],
                [userRule("rule-4", SECOND_MEMBER_ID)]
            )
        );

        expect(stored.isOk()).toBe(true);
        expect(users.calls).toEqual([
            {
                input: { where: { id_in: [MEMBER_ID, SECOND_MEMBER_ID] } },
                authorizationEnabled: false
            }
        ]);
    });

    it("does not look users up when no rule targets a user", async () => {
        const { storeWorkflow, users } = await setup();

        const stored = await storeWorkflow.execute(
            createValues([teamRule("rule-1", REVIEW_TEAM_ID)])
        );

        expect(stored.isOk()).toBe(true);
        expect(users.calls).toEqual([]);
    });

    it("refuses a user target outside the step's teams and stores nothing", async () => {
        const { storeWorkflow, getWorkflow } = await setup();

        const result = await storeWorkflow.execute(
            createValues([userRule("rule-1", MEMBER_ID), userRule("rule-2", OUTSIDER_ID)])
        );

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe("The target user is not a member of the step's teams.");
        expect(result.error.data).toEqual({
            stepId: "legal",
            field: "config.assignment.rules.target",
            workflowId: null,
            ruleId: "rule-2"
        });
        const read = await getWorkflow.execute({ id: "workflow-1" });
        expect(read.error.code).toBe("Workflows/Workflow/NotFound");
        expect(workflowEventTypes()).toEqual([]);
    });

    it("refuses a user target that does not exist (deleted user)", async () => {
        const { storeWorkflow } = await setup();

        const result = await storeWorkflow.execute(
            createValues([], [userRule("rule-9", DELETED_ID)])
        );

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe("The target user is not a member of the step's teams.");
        expect(result.error.data).toEqual({
            stepId: "editorial",
            field: "config.assignment.rules.target",
            workflowId: null,
            ruleId: "rule-9"
        });
    });

    it("refuses a team target outside the step's teams on the same save path, naming the rule, and stores nothing (Q52)", async () => {
        const { storeWorkflow, getWorkflow, users } = await setup();

        const result = await storeWorkflow.execute(
            createValues([userRule("rule-1", MEMBER_ID), teamRule("rule-2", OTHER_TEAM_ID)])
        );

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            "The target team is not one of the step's reviewing teams."
        );
        expect(result.error.data).toEqual({
            stepId: "legal",
            field: "config.assignment.rules.target",
            workflowId: null,
            ruleId: "rule-2"
        });
        // Refused by the step type, before the member lookup.
        expect(users.calls).toEqual([]);
        const read = await getWorkflow.execute({ id: "workflow-1" });
        expect(read.error.code).toBe("Workflows/Workflow/NotFound");
        expect(workflowEventTypes()).toEqual([]);
    });

    it("accepts a team target that is one of the step's teams (Q52)", async () => {
        const { storeWorkflow } = await setup();

        const stored = await storeWorkflow.execute(
            createValues([teamRule("rule-1", REVIEW_TEAM_ID)], [teamRule("rule-2", OTHER_TEAM_ID)])
        );

        expect(stored.isOk()).toBe(true);
    });

    it("refuses a team target whose team was deleted, naming the rule (D174)", async () => {
        const { storeWorkflow } = await setup();
        const values = createWorkflowValues({
            steps: [
                createReviewStep({
                    id: "legal",
                    title: "Legal review",
                    teams: [REVIEW_TEAM_ID, "team-deleted"],
                    rules: [teamRule("rule-1", REVIEW_TEAM_ID), teamRule("rule-2", "team-deleted")]
                })
            ]
        });

        const result = await storeWorkflow.execute(values);

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe("The team was deleted.");
        expect(result.error.data).toEqual({
            stepId: "legal",
            field: "config.assignment.rules.target",
            workflowId: null,
            ruleId: "rule-2"
        });
        expect(workflowEventTypes()).toEqual([]);
    });

    it("checks user targets on update too and keeps the stored workflow", async () => {
        const { storeWorkflow, getWorkflow } = await setup();
        const created = expectOk(await storeWorkflow.execute(createValues([])));

        const result = await storeWorkflow.execute(
            createValues([userRule("rule-1", OUTSIDER_ID)]),
            created.savedOn
        );

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe("The target user is not a member of the step's teams.");
        expect(result.error.data).toEqual({
            stepId: "legal",
            field: "config.assignment.rules.target",
            workflowId: null,
            ruleId: "rule-1"
        });
        const read = expectOk(await getWorkflow.execute({ id: "workflow-1" }));
        expect(read.savedOn).toBe(created.savedOn);
    });

    it("returns the persistence error when the lookup fails (R87)", async () => {
        const { storeWorkflow, getWorkflow, users } = await setup();
        users.failuresLeft = 1;

        const failed = await storeWorkflow.execute(createValues([userRule("rule-1", MEMBER_ID)]));

        expect(failed.error.code).toBe("Workflows/Workflow/Persistence");
        expect(hasErrorSource(failed.error) && failed.error.source.message).toBe(
            "Storage is not available."
        );
        const read = await getWorkflow.execute({ id: "workflow-1" });
        expect(read.error.code).toBe("Workflows/Workflow/NotFound");
    });

    it("returns the persistence error when the lookup throws (R87)", async () => {
        const { storeWorkflow } = await setup(new ThrowingListUsers());

        const thrown = await storeWorkflow.execute(createValues([userRule("rule-1", MEMBER_ID)]));

        expect(thrown.error.code).toBe("Workflows/Workflow/Persistence");
        expect(hasErrorSource(thrown.error) && thrown.error.source.message).toBe("Users are down.");
    });
});
