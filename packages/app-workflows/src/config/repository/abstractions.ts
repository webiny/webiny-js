import { createAbstraction } from "@webiny/feature/admin";
import type { AiModel } from "~/editor/domain/types.js";
import type { AiTool } from "~/editor/domain/types.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { WorkflowTeamList } from "~/editor/domain/types.js";
import type { WorkflowUserList } from "~/editor/domain/types.js";
import type { ListWorkflowTeamsUseCase } from "~/config/useCases/listWorkflowTeams/abstractions.js";
import type { ListWorkflowUsersUseCase } from "~/config/useCases/listWorkflowUsers/abstractions.js";

/*
 * The configuration lookups mapped to domain types, one repository for the config area (R343),
 * shared by its seven use cases. It caches nothing and lets every error of the gateway pass as it
 * is.
 */
export interface IWorkflowConfigRepository {
    listStepTypes(): Promise<EditorStepType[]>;
    listAutomationDefinitions(): Promise<AutomationDefinition[]>;
    listNotificationTransports(): Promise<NotificationTransport[]>;
    listTeams(params: ListWorkflowTeamsUseCase.Params): Promise<WorkflowTeamList>;
    listUsers(params: ListWorkflowUsersUseCase.Params): Promise<WorkflowUserList>;
    listAiModels(): Promise<AiModel[]>;
    listAiTools(): Promise<AiTool[]>;
}

export const WorkflowConfigRepository = createAbstraction<IWorkflowConfigRepository>(
    "Workflows/WorkflowConfigRepository"
);

export namespace WorkflowConfigRepository {
    export type Interface = IWorkflowConfigRepository;
}
