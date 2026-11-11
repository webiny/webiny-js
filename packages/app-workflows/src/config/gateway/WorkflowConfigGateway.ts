import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { toOperationError } from "~/gateway/toOperationError.js";
import { ERROR_FIELDS } from "~/review/gateway/reviewFields.js";
import type { AiModel } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { WorkflowTeamList } from "~/editor/domain/types.js";
import type { AiToolDto } from "~/editor/gateway/dto.js";
import type { AutomationDefinitionDto } from "~/editor/gateway/dto.js";
import type { EditorEnvelope } from "~/editor/gateway/dto.js";
import type { EditorStepTypeDto } from "~/editor/gateway/dto.js";
import type { WorkflowsOperationResponse } from "~/editor/gateway/dto.js";
import type { WorkflowUserListDto } from "~/editor/gateway/dto.js";
import { EDITOR_AI_MODEL_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_AI_TOOL_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_AUTOMATION_DEFINITION_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_NOTIFICATION_TRANSPORT_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_STEP_TYPE_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_TEAM_LIST_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_USER_LIST_FIELDS } from "~/editor/gateway/editorFields.js";
import type { ListTeamsParams } from "./IWorkflowConfigGateway.js";
import type { ListUsersParams } from "./IWorkflowConfigGateway.js";
import { WorkflowConfigGateway as GatewayAbstraction } from "./abstractions.js";

const LIST_STEP_TYPES = /* GraphQL */ `
    query ListWorkflowStepTypes {
        workflows {
            listStepTypes {
                data {
                    ${EDITOR_STEP_TYPE_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const LIST_AUTOMATION_DEFINITIONS = /* GraphQL */ `
    query ListWorkflowAutomationDefinitions {
        workflows {
            listAutomationDefinitions {
                data {
                    ${EDITOR_AUTOMATION_DEFINITION_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const LIST_NOTIFICATION_TRANSPORTS = /* GraphQL */ `
    query ListWorkflowNotificationTransports {
        workflows {
            listNotificationTransports {
                data {
                    ${EDITOR_NOTIFICATION_TRANSPORT_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const LIST_TEAMS = /* GraphQL */ `
    query ListWorkflowTeams($search: String, $ids: [String!], $limit: Int) {
        workflows {
            listTeams(search: $search, ids: $ids, limit: $limit) {
                data {
                    ${EDITOR_TEAM_LIST_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const LIST_USERS = /* GraphQL */ `
    query ListWorkflowUsers($search: String, $ids: [String!], $teamIds: [String!], $limit: Int) {
        workflows {
            listUsers(search: $search, ids: $ids, teamIds: $teamIds, limit: $limit) {
                data {
                    ${EDITOR_USER_LIST_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const LIST_AI_MODELS = /* GraphQL */ `
    query ListWorkflowAiModels {
        workflows {
            listAiModels {
                data {
                    ${EDITOR_AI_MODEL_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const LIST_AI_TOOLS = /* GraphQL */ `
    query ListWorkflowAiTools {
        workflows {
            listAiTools {
                data {
                    ${EDITOR_AI_TOOL_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

/*
 * The lookups on the shared `workflows` root, one implementation for every app. Each method
 * unwraps the envelope: an error or missing data becomes a `GraphQLOperationError` (R346); a
 * transport failure of the client passes as it is. `listAiModels` is a field of the AI Power-Ups
 * extension: it exists only when that extension is registered, so it is sent only when a caller
 * asks for it (R275).
 */
class WorkflowConfigGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async listStepTypes(): Promise<EditorStepTypeDto[]> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<"listStepTypes", EditorEnvelope<EditorStepTypeDto[]>>
        >({
            query: LIST_STEP_TYPES
        });

        const envelope = response.workflows.listStepTypes;
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listAutomationDefinitions(): Promise<AutomationDefinitionDto[]> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<
                "listAutomationDefinitions",
                EditorEnvelope<AutomationDefinitionDto[]>
            >
        >({
            query: LIST_AUTOMATION_DEFINITIONS
        });

        const envelope = response.workflows.listAutomationDefinitions;
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listNotificationTransports(): Promise<NotificationTransport[]> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<
                "listNotificationTransports",
                EditorEnvelope<NotificationTransport[]>
            >
        >({
            query: LIST_NOTIFICATION_TRANSPORTS
        });

        const envelope = response.workflows.listNotificationTransports;
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listTeams(params: ListTeamsParams): Promise<WorkflowTeamList> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<"listTeams", EditorEnvelope<WorkflowTeamList>>
        >({
            query: LIST_TEAMS,
            variables: { search: params.search, ids: params.ids, limit: params.limit }
        });

        const envelope = response.workflows.listTeams;
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listUsers(params: ListUsersParams): Promise<WorkflowUserListDto> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<"listUsers", EditorEnvelope<WorkflowUserListDto>>
        >({
            query: LIST_USERS,
            variables: {
                search: params.search,
                ids: params.ids,
                teamIds: params.teamIds,
                limit: params.limit
            }
        });

        const envelope = response.workflows.listUsers;
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listAiModels(): Promise<AiModel[]> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<"listAiModels", EditorEnvelope<AiModel[]>>
        >({
            query: LIST_AI_MODELS
        });

        const envelope = response.workflows.listAiModels;
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listAiTools(): Promise<AiToolDto[]> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<"listAiTools", EditorEnvelope<AiToolDto[]>>
        >({
            query: LIST_AI_TOOLS
        });

        const envelope = response.workflows.listAiTools;
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }
}

export const WorkflowConfigGateway = GatewayAbstraction.createImplementation({
    implementation: WorkflowConfigGatewayImpl,
    dependencies: [MainGraphQLClient]
});
