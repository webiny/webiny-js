import type { AiToolDto } from "./dto.js";
import type { AutomationDefinitionDto } from "./dto.js";
import type { EditorEnvelope } from "./dto.js";
import type { EditorStepTypeDto } from "./dto.js";
import type { WorkflowUserListDto } from "./dto.js";
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
 * The editor's lookups on the shared `workflows` root. One implementation serves both apps. Every
 * method resolves with the envelope, also for a server error, and rejects only on a transport
 * failure (R204).
 */
export interface IWorkflowConfigGateway {
    listStepTypes(): Promise<EditorEnvelope<EditorStepTypeDto[]>>;
    listAutomationDefinitions(): Promise<EditorEnvelope<AutomationDefinitionDto[]>>;
    listNotificationTransports(): Promise<EditorEnvelope<NotificationTransport[]>>;
    listTeams(params: ListTeamsParams): Promise<EditorEnvelope<WorkflowTeamList>>;
    listUsers(params: ListUsersParams): Promise<EditorEnvelope<WorkflowUserListDto>>;
    listAiModels(): Promise<EditorEnvelope<AiModel[]>>;
    listAiTools(): Promise<EditorEnvelope<AiToolDto[]>>;
}
