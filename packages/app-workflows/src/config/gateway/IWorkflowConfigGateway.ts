import type { AiToolDto } from "~/editor/gateway/dto.js";
import type { AutomationDefinitionDto } from "~/editor/gateway/dto.js";
import type { EditorStepTypeDto } from "~/editor/gateway/dto.js";
import type { WorkflowUserListDto } from "~/editor/gateway/dto.js";
import type { AiModel } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { WorkflowTeamList } from "~/editor/domain/types.js";

export interface ListTeamsParams {
    search: string | null;
    ids: string[] | null;
    limit: number | null;
}

export interface ListUsersParams {
    search: string | null;
    // A lookup by id ignores `search`, `limit` and `teamIds` on the server (R286).
    ids: string[] | null;
    // Only users who are in any of these teams; `null` for every user.
    teamIds: string[] | null;
    limit: number | null;
}

/*
 * The configuration lookups on the shared `workflows` root. One implementation serves every app.
 * Every method returns the envelope's data, throws a `GraphQLOperationError` for an envelope with an
 * error or without data (R346), and lets a transport failure pass as it is.
 */
export interface IWorkflowConfigGateway {
    listStepTypes(): Promise<EditorStepTypeDto[]>;
    listAutomationDefinitions(): Promise<AutomationDefinitionDto[]>;
    listNotificationTransports(): Promise<NotificationTransport[]>;
    listTeams(params: ListTeamsParams): Promise<WorkflowTeamList>;
    listUsers(params: ListUsersParams): Promise<WorkflowUserListDto>;
    listAiModels(): Promise<AiModel[]>;
    listAiTools(): Promise<AiToolDto[]>;
}
