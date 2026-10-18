import { describe, expect, it } from "vitest";
import zod from "zod";
import { automationStepConfigSchema } from "~/domain/automation/automationStepConfigSchema.js";
import {
    registerTestAutomation,
    TEST_AUTOMATION_ID
} from "~tests/__helpers/TestAutomationDefinition.js";
import { registerTestAiTool, TEST_AI_TOOL_NAME } from "~tests/__helpers/TestWorkflowAiTool.js";
import { BUILT_IN_AI_TOOL_NAMES } from "~/features/aiTools/constants.js";
import { withoutBuiltInAiTools } from "~tests/__helpers/withoutBuiltInAiTools.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { PROJECT_PACKAGE_FEATURE_NAME } from "@webiny/wcp/types.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { MailerService } from "@webiny/api-mailer";
import { NotificationTransport } from "~/features/notifications/NotificationTransport/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { FakeListUsers, type FakeUser } from "~tests/__helpers/FakeListUsers.js";

const EDITOR: SecurityPermission[] = [{ name: "workflows", editor: true }];
/** Has a workflows permission, but not `editor`. */
const REASSIGNER: SecurityPermission[] = [{ name: "workflows", reassign: true }];

const FUTURE = "2999-01-01T00:00:00.000Z";
const PAST = "2000-01-01T00:00:00.000Z";

/** The fake gives every user the email `<id>@webiny.test`. */
const API_USERS: FakeUser[] = [
    { id: "user-cara", displayName: "Cara Clark", teams: [] },
    { id: "user-anna", displayName: "Anna Adams", teams: [] }
];

const ERROR_FIELDS = /* GraphQL */ `
    error {
        code
        message
        data
    }
`;

const SETTINGS_FIELDS = /* GraphQL */ `
    data {
        exclusions {
            userId
            reason
            endsOn
        }
    }
    ${ERROR_FIELDS}
`;

const GET_SETTINGS = /* GraphQL */ `
    query GetSettings($includeExpired: Boolean) {
        workflows {
            getSettings(includeExpired: $includeExpired) {
                ${SETTINGS_FIELDS}
            }
        }
    }
`;

const UPDATE_SETTINGS = /* GraphQL */ `
    mutation UpdateSettings($data: WorkflowsSettingsInput!) {
        workflows {
            updateSettings(data: $data) {
                ${SETTINGS_FIELDS}
            }
        }
    }
`;

const LIST_STEP_TYPES = /* GraphQL */ `
    query ListStepTypes {
        workflows {
            listStepTypes {
                data {
                    type
                    title
                    available
                    unavailableReason
                    configSchema
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

const LIST_AI_TOOLS = /* GraphQL */ `
    query ListAiTools {
        workflows {
            listAiTools {
                data {
                    name
                    title
                    description
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

const LIST_NOTIFICATION_TRANSPORTS = /* GraphQL */ `
    query ListNotificationTransports {
        workflows {
            listNotificationTransports {
                data {
                    id
                    title
                    description
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

const LIST_AUTOMATION_DEFINITIONS = /* GraphQL */ `
    query ListAutomationDefinitions {
        workflows {
            listAutomationDefinitions {
                data {
                    id
                    name
                    models
                    settingsSchema
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

const LIST_USERS = /* GraphQL */ `
    query ListUsers($search: String, $ids: [String!], $limit: Int) {
        workflows {
            listUsers(search: $search, ids: $ids, limit: $limit) {
                data {
                    users {
                        id
                        displayName
                    }
                    missingIds
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

interface ErrorRow {
    code: string;
    message: string;
    data: unknown;
}

interface ExclusionRow {
    userId: string;
    reason: string | null;
    endsOn: string | null;
}

interface SettingsRow {
    exclusions: ExclusionRow[];
}

interface SettingsEnvelope {
    data: SettingsRow | null;
    error: ErrorRow | null;
}

interface JsonSchemaRow {
    type?: string;
    properties?: Record<string, unknown>;
}

interface StepTypeRow {
    type: string;
    title: string;
    available: boolean;
    unavailableReason: string | null;
    configSchema: JsonSchemaRow | null;
}

interface StepTypesEnvelope {
    data: StepTypeRow[] | null;
    error: ErrorRow | null;
}

interface AutomationDefinitionRow {
    id: string;
    name: string;
    models: string[];
    settingsSchema: JsonSchemaRow | null;
}

interface AutomationDefinitionsEnvelope {
    data: AutomationDefinitionRow[] | null;
    error: ErrorRow | null;
}

interface ListAutomationDefinitionsResult {
    listAutomationDefinitions: AutomationDefinitionsEnvelope;
}

interface AiToolRow {
    name: string;
    title: string;
    description: string;
}

interface AiToolsEnvelope {
    data: AiToolRow[] | null;
    error: ErrorRow | null;
}

interface ListAiToolsResult {
    listAiTools: AiToolsEnvelope;
}

interface NotificationTransportRow {
    id: string;
    title: string;
    description: string | null;
}

interface NotificationTransportsEnvelope {
    data: NotificationTransportRow[] | null;
    error: ErrorRow | null;
}

interface ListNotificationTransportsResult {
    listNotificationTransports: NotificationTransportsEnvelope;
}

interface UserRow {
    id: string;
    displayName: string;
}

interface UserListRow {
    users: UserRow[];
    missingIds: string[];
}

interface UserListEnvelope {
    data: UserListRow | null;
    error: ErrorRow | null;
}

interface GetSettingsResult {
    getSettings: SettingsEnvelope;
}

interface UpdateSettingsResult {
    updateSettings: SettingsEnvelope;
}

interface ListStepTypesResult {
    listStepTypes: StepTypesEnvelope;
}

interface ListUsersResult {
    listUsers: UserListEnvelope;
}

interface WorkflowsRoot<TResult> {
    workflows: TResult;
}

interface GraphQLBody<TData> {
    data: TData;
}

interface IntrospectionNamedRow {
    name: string;
}

interface IntrospectionTypeRow {
    name: string;
    fields: IntrospectionNamedRow[] | null;
    inputFields: IntrospectionNamedRow[] | null;
    enumValues: IntrospectionNamedRow[] | null;
}

interface IntrospectionSchemaRow {
    types: IntrospectionTypeRow[];
}

interface IntrospectionData {
    __schema: IntrospectionSchemaRow;
}

const createApi = async (params: CmsTestHandlerParams) => {
    const users = new FakeListUsers(API_USERS);
    // The use case test pins the `withoutAuthorization` wrap; here only the calls are counted.
    const { createQuery, createMutation } = await createContextHandler({
        ...params,
        setup: async container => {
            container.registerInstance(ListUsersUseCase, users);
            await params.setup?.(container);
        }
    });
    return {
        users,
        getSettings: createQuery<GraphQLBody<WorkflowsRoot<GetSettingsResult>>>(GET_SETTINGS),
        updateSettings:
            createMutation<GraphQLBody<WorkflowsRoot<UpdateSettingsResult>>>(UPDATE_SETTINGS),
        listStepTypes:
            createQuery<GraphQLBody<WorkflowsRoot<ListStepTypesResult>>>(LIST_STEP_TYPES),
        listAutomationDefinitions: createQuery<
            GraphQLBody<WorkflowsRoot<ListAutomationDefinitionsResult>>
        >(LIST_AUTOMATION_DEFINITIONS),
        listAiTools: createQuery<GraphQLBody<WorkflowsRoot<ListAiToolsResult>>>(LIST_AI_TOOLS),
        listNotificationTransports: createQuery<
            GraphQLBody<WorkflowsRoot<ListNotificationTransportsResult>>
        >(LIST_NOTIFICATION_TRANSPORTS),
        listUsers: createQuery<GraphQLBody<WorkflowsRoot<ListUsersResult>>>(LIST_USERS)
    };
};

const notAuthorized = (action: string): SettingsEnvelope => {
    return {
        data: null,
        error: {
            code: "Workflows/NotAuthorized",
            message: `You are not allowed to ${action}.`,
            data: { action }
        }
    };
};

/** Field, input field or enum value names of one type, in SDL order. */
const memberNames = (types: IntrospectionTypeRow[], name: string): string[] => {
    const type = types.find(item => item.name === name);
    const members = type?.fields ?? type?.inputFields ?? type?.enumValues ?? [];
    return members.map(member => member.name);
};

describe("workflows GraphQL root", () => {
    it("returns and updates the settings for an editor (D133)", async () => {
        const api = await createApi({ permissions: EDITOR });

        const [initial] = await api.getSettings();
        expect(initial.data.workflows.getSettings).toEqual({
            data: { exclusions: [] },
            error: null
        });

        const [updated] = await api.updateSettings({
            data: {
                exclusions: [
                    { userId: "user-a", reason: "On leave", endsOn: FUTURE },
                    { userId: "user-b", endsOn: PAST }
                ]
            }
        });
        expect(updated.data.workflows.updateSettings).toEqual({
            data: {
                exclusions: [
                    { userId: "user-a", reason: "On leave", endsOn: FUTURE },
                    { userId: "user-b", reason: null, endsOn: PAST }
                ]
            },
            error: null
        });

        const [active] = await api.getSettings();
        expect(active.data.workflows.getSettings.data).toEqual({
            exclusions: [{ userId: "user-a", reason: "On leave", endsOn: FUTURE }]
        });

        const [all] = await api.getSettings({ includeExpired: true });
        expect(all.data.workflows.getSettings.data?.exclusions.map(row => row.userId)).toEqual([
            "user-a",
            "user-b"
        ]);
    });

    it("refuses the settings to a user without editor, with code and data", async () => {
        const reassigner = await createApi({ permissions: REASSIGNER });

        const [read] = await reassigner.getSettings();
        expect(read.data.workflows.getSettings).toEqual(
            notAuthorized("view the workflow settings")
        );

        const [write] = await reassigner.updateSettings({
            data: { exclusions: [{ userId: "user-a" }] }
        });
        expect(write.data.workflows.updateSettings).toEqual(
            notAuthorized("change the workflow settings")
        );

        const editor = await createApi({ permissions: EDITOR });
        const [stored] = await editor.getSettings({ includeExpired: true });
        expect(stored.data.workflows.getSettings.data).toEqual({ exclusions: [] });
    });

    it("returns the settings validation error with code and data", async () => {
        const api = await createApi({ permissions: EDITOR });

        const [response] = await api.updateSettings({
            data: {
                exclusions: [{ userId: "user-a" }, { userId: "user-a", endsOn: FUTURE }]
            }
        });

        expect(response.data.workflows.updateSettings).toEqual({
            data: null,
            error: {
                code: "Workflows/Settings/Validation",
                message: "This user is already in the list. Edit it instead.",
                data: { userId: "user-a" }
            }
        });
    });

    it("lists the step types with AI unavailable without AI powerups (D130)", async () => {
        const api = await createApi({ permissions: EDITOR });

        const [response] = await api.listStepTypes();
        const { data, error } = response.data.workflows.listStepTypes;

        expect(error).toBeNull();
        expect(data?.map(row => row.type)).toEqual(["review", "ai", "automation"]);
        const [review, ai, automation] = data ?? [];
        expect(review).toMatchObject({
            title: "Review",
            available: true,
            unavailableReason: null
        });
        expect(review.configSchema).toMatchObject({ type: "object" });
        expect(Object.keys(review.configSchema?.properties ?? {})).toEqual(["teams", "assignment"]);
        expect(ai).toEqual({
            type: "ai",
            title: "AI",
            available: false,
            unavailableReason: "AI powerups are not enabled.",
            configSchema: null
        });
        expect(automation).toEqual({
            type: "automation",
            title: "Automation",
            available: false,
            unavailableReason: "No automation is defined.",
            configSchema: zod.toJSONSchema(automationStepConfigSchema, {
                io: "input",
                unrepresentable: "any"
            })
        });
    });

    it("lists AI as available with AI powerups (D130)", async () => {
        const license = createTestWcpLicense();
        license.package.features[PROJECT_PACKAGE_FEATURE_NAME.AI_POWERUPS] = {
            enabled: true,
            options: { cms: { entryGeneration: true } }
        };
        const api = await createApi({ permissions: EDITOR, testProjectLicense: license });

        const [response] = await api.listStepTypes();
        const ai = response.data.workflows.listStepTypes.data?.find(row => row.type === "ai");

        expect(ai).toEqual({
            type: "ai",
            title: "AI",
            available: true,
            unavailableReason: null,
            configSchema: null
        });
    });

    it("refuses the step types to a user without editor", async () => {
        const api = await createApi({ permissions: REASSIGNER });

        const [response] = await api.listStepTypes();

        expect(response.data.workflows.listStepTypes).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to list the step types.",
                data: { action: "list the step types" }
            }
        });
    });

    it("lists the step types with automation available once a definition is registered", async () => {
        const api = await createApi({
            permissions: EDITOR,
            setup: container => {
                registerTestAutomation(container);
            }
        });

        const [response] = await api.listStepTypes();
        const automation = response.data.workflows.listStepTypes.data?.find(
            row => row.type === "automation"
        );

        expect(automation).toMatchObject({ available: true, unavailableReason: null });
    });

    it("lists the automation definitions with their settings schema (R138)", async () => {
        const api = await createApi({
            permissions: EDITOR,
            setup: container => {
                registerTestAutomation(container, { models: ["cms.*"] });
            }
        });

        const [response] = await api.listAutomationDefinitions();
        const { data, error } = response.data.workflows.listAutomationDefinitions;

        expect(error).toBeNull();
        expect(data).toHaveLength(1);
        expect(data?.[0]).toMatchObject({
            id: TEST_AUTOMATION_ID,
            name: "Test automation",
            models: ["cms.*"]
        });
        expect(data?.[0].settingsSchema).toMatchObject({ type: "object" });
        expect(Object.keys(data?.[0].settingsSchema?.properties ?? {})).toEqual([
            "mode",
            "comment"
        ]);
    });

    it("lists no automation definitions when none is registered", async () => {
        const api = await createApi({ permissions: EDITOR });

        const [response] = await api.listAutomationDefinitions();

        expect(response.data.workflows.listAutomationDefinitions).toEqual({
            data: [],
            error: null
        });
    });

    it("refuses the automation definitions to a user without editor", async () => {
        const api = await createApi({ permissions: REASSIGNER });

        const [response] = await api.listAutomationDefinitions();

        expect(response.data.workflows.listAutomationDefinitions).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to list automations.",
                data: { action: "list automations" }
            }
        });
    });

    it("lists the AI tools by title, with no schema (R167, R176)", async () => {
        const api = await createApi({
            permissions: EDITOR,
            setup: container => {
                registerTestAiTool(container, { name: "zuluTool", title: "Zulu" });
                registerTestAiTool(container, {
                    title: "Alpha",
                    description: "A tool for tests."
                });
            }
        });

        const [response] = await api.listAiTools();

        const envelope = response.data.workflows.listAiTools;

        expect(envelope.error).toBeNull();
        expect(withoutBuiltInAiTools(envelope.data ?? [])).toEqual([
            { name: TEST_AI_TOOL_NAME, title: "Alpha", description: "A tool for tests." },
            { name: "zuluTool", title: "Zulu", description: "A tool for tests." }
        ]);
    });

    it("lists only the built-in AI tools when no other is registered", async () => {
        const api = await createApi({ permissions: EDITOR });

        const [response] = await api.listAiTools();

        const envelope = response.data.workflows.listAiTools;
        expect(envelope.error).toBeNull();
        expect((envelope.data ?? []).map(row => row.name)).toEqual(BUILT_IN_AI_TOOL_NAMES);
    });

    it("refuses the AI tools to a user without editor", async () => {
        const api = await createApi({ permissions: REASSIGNER });

        const [response] = await api.listAiTools();

        expect(response.data.workflows.listAiTools).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to list AI tools.",
                data: { action: "list AI tools" }
            }
        });
    });

    it("lists the notification transports for an editor with an optional description", async () => {
        const api = await createApi({
            permissions: EDITOR,
            setup: container => {
                container.registerInstance(MailerService, {} as MailerService.Interface);
                container.registerInstance(NotificationTransport, {
                    id: "plain",
                    title: "Plain",
                    send: async () => {}
                });
            }
        });

        const [response] = await api.listNotificationTransports();

        expect(response.data.workflows.listNotificationTransports).toEqual({
            data: [
                {
                    id: "e-mail",
                    title: "E-Mail",
                    description: "Sends an e-mail to the people who need to act."
                },
                { id: "plain", title: "Plain", description: null }
            ],
            error: null
        });
    });

    it("refuses the notification transports to a user without editor", async () => {
        const api = await createApi({
            permissions: REASSIGNER,
            setup: container => {
                container.registerInstance(MailerService, {} as MailerService.Interface);
            }
        });

        const [response] = await api.listNotificationTransports();

        expect(response.data.workflows.listNotificationTransports).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to list notification transports.",
                data: { action: "list notification transports" }
            }
        });
    });

    it("lists users for an editor, by search and by ids (D48, D117)", async () => {
        const api = await createApi({ permissions: EDITOR });

        const [searched] = await api.listUsers({ search: "ANNA" });
        const [byIds] = await api.listUsers({ ids: ["user-cara", "user-gone"] });

        expect(searched.data.workflows.listUsers).toEqual({
            data: { users: [{ id: "user-anna", displayName: "Anna Adams" }], missingIds: [] },
            error: null
        });
        expect(byIds.data.workflows.listUsers).toEqual({
            data: {
                users: [{ id: "user-cara", displayName: "Cara Clark" }],
                missingIds: ["user-gone"]
            },
            error: null
        });
        expect(api.users.calls).toHaveLength(2);
    });

    it("refuses the user list to a user without editor", async () => {
        const api = await createApi({ permissions: REASSIGNER });

        const [response] = await api.listUsers({ limit: 10 });

        expect(response.data.workflows.listUsers).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to list users.",
                data: { action: "list users" }
            }
        });
        expect(api.users.calls).toEqual([]);
    });

    it("exposes the shared types the app schemas reuse (R100)", async () => {
        const { introspect } = await createContextHandler({ permissions: EDITOR });

        const [body] = await introspect();
        const introspection: GraphQLBody<IntrospectionData> = body;
        const types = introspection.data.__schema.types;

        expect(memberNames(types, "Query")).toContain("workflows");
        expect(memberNames(types, "Mutation")).toContain("workflows");
        expect(memberNames(types, "WorkflowsQuery")).toEqual([
            "getSettings",
            "listStepTypes",
            "listAutomationDefinitions",
            "listAiTools",
            "listNotificationTransports",
            "listUsers"
        ]);
        expect(memberNames(types, "WorkflowsAutomationDefinition")).toEqual([
            "id",
            "name",
            "models",
            "settingsSchema"
        ]);
        expect(memberNames(types, "WorkflowsAutomationDefinitionListResponse")).toEqual([
            "data",
            "error"
        ]);
        expect(memberNames(types, "WorkflowsAiTool")).toEqual(["name", "title", "description"]);
        expect(memberNames(types, "WorkflowsAiToolListResponse")).toEqual(["data", "error"]);
        expect(memberNames(types, "WorkflowsNotificationTransport")).toEqual([
            "id",
            "title",
            "description"
        ]);
        expect(memberNames(types, "WorkflowsNotificationTransportListResponse")).toEqual([
            "data",
            "error"
        ]);
        expect(memberNames(types, "WorkflowsUser")).toEqual(["id", "displayName"]);
        expect(memberNames(types, "WorkflowsTeam")).toEqual(["id", "name"]);
        expect(memberNames(types, "WorkflowsUserListResult")).toEqual(["users", "missingIds"]);
        expect(memberNames(types, "WorkflowsUserListResponse")).toEqual(["data", "error"]);
        expect(memberNames(types, "WorkflowsStepCandidate")).toEqual([
            "id",
            "displayName",
            "excluded",
            "excludedReason"
        ]);
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
        expect(memberNames(types, "WorkflowsRoutingSkip")).toEqual([
            "userId",
            "displayName",
            "reason"
        ]);
        expect(memberNames(types, "WorkflowsRoutingInspection")).toEqual([
            "owner",
            "source",
            "ruleId",
            "strategy",
            "trace",
            "skipped"
        ]);
        expect(memberNames(types, "WorkflowsMutation")).toEqual(["updateSettings"]);
        expect(memberNames(types, "WorkflowsError")).toEqual(["code", "message", "data", "stack"]);
        expect(memberNames(types, "WorkflowsListMeta")).toEqual(["cursor", "hasMoreItems"]);
        expect(memberNames(types, "WorkflowsBooleanResponse")).toEqual(["data", "error"]);
        expect(memberNames(types, "WorkflowsActor")).toEqual([
            "type",
            "id",
            "displayName",
            "identityType"
        ]);
        expect(memberNames(types, "WorkflowsWorkflow")).toEqual([
            "id",
            "name",
            "models",
            "steps",
            "createdOn",
            "savedOn",
            "createdBy",
            "savedBy"
        ]);
        expect(memberNames(types, "WorkflowsWorkflowInput")).toEqual([
            "id",
            "name",
            "models",
            "steps"
        ]);
        const stepFields = [
            "id",
            "title",
            "color",
            "description",
            "type",
            "notifications",
            "config"
        ];
        expect(memberNames(types, "WorkflowsStep")).toEqual(stepFields);
        expect(memberNames(types, "WorkflowsStepInput")).toEqual(stepFields);
        expect(memberNames(types, "WorkflowsReview")).toEqual([
            "id",
            "workflowId",
            "model",
            "targetId",
            "targetRevisionId",
            "title",
            "isActive",
            "state",
            "currentStepId",
            "currentStepState",
            "currentStepType",
            "currentOwnerId",
            "currentCandidateTeamIds",
            "targetContext",
            "workflow",
            "steps",
            "createdBy",
            "cancelledBy",
            "createdOn",
            "savedOn",
            "lastChangedOn"
        ]);
        expect(memberNames(types, "WorkflowsReviewStep")).toEqual([
            ...stepFields,
            "state",
            "owner",
            "comment",
            "pickedUserId",
            "candidateTeamIds",
            "candidateTeams",
            "assignmentSource",
            "assignment",
            "reachedOn",
            "startedOn",
            "finishedOn",
            "taskId",
            "runs",
            "issues",
            "assignments"
        ]);
        expect(memberNames(types, "WorkflowsStepRun")).toEqual([
            "taskId",
            "startedOn",
            "finishedOn",
            "outcome",
            "reason"
        ]);
        expect(memberNames(types, "WorkflowsStepRunInfo")).toEqual([
            "taskId",
            "status",
            "startedOn",
            "finishedOn",
            "iterations",
            "outcome",
            "reason"
        ]);
        expect(memberNames(types, "WorkflowsAiIssue")).toEqual([
            "fieldPath",
            "severity",
            "message",
            "suggestion"
        ]);
        expect(memberNames(types, "WorkflowsAssignmentEntry")).toEqual([
            "id",
            "kind",
            "userId",
            "userDisplayName",
            "assignedOn",
            "source",
            "ruleId",
            "by",
            "reason"
        ]);
        expect(memberNames(types, "WorkflowsAssignmentKind")).toEqual(["outcome", "skip"]);
        expect(memberNames(types, "WorkflowsViewerFlags")).toEqual([
            "canStart",
            "canTakeOver",
            "canApprove",
            "canReject",
            "canCancel",
            "canReassign",
            "canRestart"
        ]);
        expect(memberNames(types, "WorkflowsReviewWithFlags")).toEqual(["review", "flags"]);
        expect(memberNames(types, "WorkflowsBlockingReview")).toEqual([
            "reviewId",
            "model",
            "targetId",
            "targetRevisionId",
            "title",
            "stepPosition",
            "stepCount",
            "stepName"
        ]);
        expect(memberNames(types, "WorkflowsReviewListKind")).toEqual([
            "assignedToMe",
            "pool",
            "teamInReview",
            "myRequests",
            "failedSteps"
        ]);
        expect(memberNames(types, "WorkflowsReviewListSort")).toEqual([
            "lastChangedOn_ASC",
            "lastChangedOn_DESC"
        ]);
        expect(memberNames(types, "WorkflowsReviewListWhere")).toEqual([
            "modelId",
            "titleContains",
            "reviewState",
            "stepState"
        ]);
        expect(memberNames(types, "WorkflowsReviewPickInput")).toEqual(["stepId", "userId"]);
        expect(memberNames(types, "WorkflowsReviewsForDeleteAction")).toEqual(["trash", "delete"]);
        expect(memberNames(types, "WorkflowsReviewState")).toEqual([
            "inProgress",
            "approved",
            "rejected",
            "cancelled"
        ]);
        expect(memberNames(types, "WorkflowsStepState")).toEqual([
            "pending",
            "awaiting",
            "inReview",
            "approved",
            "rejected",
            "failed"
        ]);
    });
});
