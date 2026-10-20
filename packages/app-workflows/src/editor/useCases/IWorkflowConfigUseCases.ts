import type { ListTeamsParams } from "~/config/gateway/IWorkflowConfigGateway.js";
import type { ListUsersParams } from "~/config/gateway/IWorkflowConfigGateway.js";
import type { AiModel } from "~/editor/domain/types.js";
import type { AiTool } from "~/editor/domain/types.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { WorkflowTeamList } from "~/editor/domain/types.js";
import type { WorkflowUserList } from "~/editor/domain/types.js";

/*
 * The editor's lookups. Every method throws a `GraphQLOperationError` for a server error or the
 * transport `Error` as is (R204). `listAiModels` and `listAiTools` are called only when the AI step
 * type is available and has a config schema (R275).
 */
export interface IWorkflowConfigUseCases {
    listStepTypes(): Promise<EditorStepType[]>;
    listAutomationDefinitions(): Promise<AutomationDefinition[]>;
    listNotificationTransports(): Promise<NotificationTransport[]>;
    listTeams(params: ListTeamsParams): Promise<WorkflowTeamList>;
    listUsers(params: ListUsersParams): Promise<WorkflowUserList>;
    listAiModels(): Promise<AiModel[]>;
    listAiTools(): Promise<AiTool[]>;
}
