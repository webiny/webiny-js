import { WorkflowConfigGateway } from "~/config/gateway/abstractions.js";
import type { ListWorkflowTeamsUseCase } from "~/config/useCases/listWorkflowTeams/abstractions.js";
import type { ListWorkflowUsersUseCase } from "~/config/useCases/listWorkflowUsers/abstractions.js";
import type { AiModel } from "~/editor/domain/types.js";
import type { AiTool } from "~/editor/domain/types.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { WorkflowTeamList } from "~/editor/domain/types.js";
import type { WorkflowUserList } from "~/editor/domain/types.js";
import { mapAiTool } from "~/editor/gateway/mapAiTool.js";
import { mapAutomationDefinition } from "~/editor/gateway/mapAutomationDefinition.js";
import { mapEditorStepType } from "~/editor/gateway/mapEditorStepType.js";
import { mapWorkflowUserList } from "~/editor/gateway/mapWorkflowUserList.js";
import { WorkflowConfigRepository as RepositoryAbstraction } from "./abstractions.js";

/*
 * Maps the config gateway's DTOs to domain types. The transports, the team list and the AI models
 * have the same shape as their DTOs and pass as they are.
 */
class WorkflowConfigRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: WorkflowConfigGateway.Interface) {}

    public async listStepTypes(): Promise<EditorStepType[]> {
        const dtos = await this.gateway.listStepTypes();
        return dtos.map(mapEditorStepType);
    }

    public async listAutomationDefinitions(): Promise<AutomationDefinition[]> {
        const dtos = await this.gateway.listAutomationDefinitions();
        return dtos.map(mapAutomationDefinition);
    }

    public listNotificationTransports(): Promise<NotificationTransport[]> {
        return this.gateway.listNotificationTransports();
    }

    public listTeams(params: ListWorkflowTeamsUseCase.Params): Promise<WorkflowTeamList> {
        return this.gateway.listTeams(params);
    }

    public async listUsers(params: ListWorkflowUsersUseCase.Params): Promise<WorkflowUserList> {
        const dto = await this.gateway.listUsers(params);
        return mapWorkflowUserList(dto);
    }

    public listAiModels(): Promise<AiModel[]> {
        return this.gateway.listAiModels();
    }

    public async listAiTools(): Promise<AiTool[]> {
        const dtos = await this.gateway.listAiTools();
        return dtos.map(mapAiTool);
    }
}

export const WorkflowConfigRepository = RepositoryAbstraction.createImplementation({
    implementation: WorkflowConfigRepositoryImpl,
    dependencies: [WorkflowConfigGateway]
});
