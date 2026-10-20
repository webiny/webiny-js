import type { ListTeamsParams } from "~/config/gateway/IWorkflowConfigGateway.js";
import type { ListUsersParams } from "~/config/gateway/IWorkflowConfigGateway.js";
import { ListAiModelsUseCase } from "~/config/useCases/listAiModels/abstractions.js";
import { ListAiToolsUseCase } from "~/config/useCases/listAiTools/abstractions.js";
import { ListAutomationDefinitionsUseCase } from "~/config/useCases/listAutomationDefinitions/abstractions.js";
import { ListNotificationTransportsUseCase } from "~/config/useCases/listNotificationTransports/abstractions.js";
import { ListStepTypesUseCase } from "~/config/useCases/listStepTypes/abstractions.js";
import { ListWorkflowTeamsUseCase } from "~/config/useCases/listWorkflowTeams/abstractions.js";
import { ListWorkflowUsersUseCase } from "~/config/useCases/listWorkflowUsers/abstractions.js";
import type { AiModel } from "~/editor/domain/types.js";
import type { AiTool } from "~/editor/domain/types.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { WorkflowTeamList } from "~/editor/domain/types.js";
import type { WorkflowUserList } from "~/editor/domain/types.js";
import { WorkflowConfigUseCases as UseCasesAbstraction } from "./abstractions.js";

/*
 * A temporary bridge (R356): the old config bundle delegates every method to its config use case,
 * so a consumer that still injects the bundle keeps working while the consumers move (Task 4).
 * Task 14 deletes it with its interface, token and fake.
 */
class WorkflowConfigUseCasesImpl implements UseCasesAbstraction.Interface {
    constructor(
        private listStepTypesUseCase: ListStepTypesUseCase.Interface,
        private listAutomationDefinitionsUseCase: ListAutomationDefinitionsUseCase.Interface,
        private listNotificationTransportsUseCase: ListNotificationTransportsUseCase.Interface,
        private listWorkflowTeamsUseCase: ListWorkflowTeamsUseCase.Interface,
        private listWorkflowUsersUseCase: ListWorkflowUsersUseCase.Interface,
        private listAiModelsUseCase: ListAiModelsUseCase.Interface,
        private listAiToolsUseCase: ListAiToolsUseCase.Interface
    ) {}

    public listStepTypes(): Promise<EditorStepType[]> {
        return this.listStepTypesUseCase.execute();
    }

    public listAutomationDefinitions(): Promise<AutomationDefinition[]> {
        return this.listAutomationDefinitionsUseCase.execute();
    }

    public listNotificationTransports(): Promise<NotificationTransport[]> {
        return this.listNotificationTransportsUseCase.execute();
    }

    public listTeams(params: ListTeamsParams): Promise<WorkflowTeamList> {
        return this.listWorkflowTeamsUseCase.execute(params);
    }

    public listUsers(params: ListUsersParams): Promise<WorkflowUserList> {
        return this.listWorkflowUsersUseCase.execute(params);
    }

    public listAiModels(): Promise<AiModel[]> {
        return this.listAiModelsUseCase.execute();
    }

    public listAiTools(): Promise<AiTool[]> {
        return this.listAiToolsUseCase.execute();
    }
}

export const WorkflowConfigUseCases = UseCasesAbstraction.createImplementation({
    implementation: WorkflowConfigUseCasesImpl,
    dependencies: [
        ListStepTypesUseCase,
        ListAutomationDefinitionsUseCase,
        ListNotificationTransportsUseCase,
        ListWorkflowTeamsUseCase,
        ListWorkflowUsersUseCase,
        ListAiModelsUseCase,
        ListAiToolsUseCase
    ]
});
