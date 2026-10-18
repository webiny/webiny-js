import { WorkflowConfigGateway } from "~/editor/gateway/WorkflowConfigGateway.js";
import type { ListTeamsParams } from "~/editor/gateway/IWorkflowConfigGateway.js";
import { mapAiTool } from "~/editor/gateway/mapAiTool.js";
import { mapAutomationDefinition } from "~/editor/gateway/mapAutomationDefinition.js";
import { mapEditorStepType } from "~/editor/gateway/mapEditorStepType.js";
import type { AiModel } from "~/editor/domain/types.js";
import type { AiTool } from "~/editor/domain/types.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { WorkflowTeamList } from "~/editor/domain/types.js";
import { WorkflowConfigUseCases as UseCasesAbstraction } from "./WorkflowConfigUseCases.js";
import { toOperationError } from "./toOperationError.js";

/*
 * One implementation for both apps: the lookups are on the shared `workflows` root and the gateway
 * is bound once, so unlike `WorkflowEditorUseCases` this class is not subclassed (R237 concerns a
 * class bound under more than one token).
 */
class WorkflowConfigUseCasesImpl implements UseCasesAbstraction.Interface {
    constructor(private gateway: WorkflowConfigGateway.Interface) {}

    public async listStepTypes(): Promise<EditorStepType[]> {
        const envelope = await this.gateway.listStepTypes();
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data.map(mapEditorStepType);
    }

    public async listAutomationDefinitions(): Promise<AutomationDefinition[]> {
        const envelope = await this.gateway.listAutomationDefinitions();
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data.map(mapAutomationDefinition);
    }

    public async listNotificationTransports(): Promise<NotificationTransport[]> {
        const envelope = await this.gateway.listNotificationTransports();
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    public async listTeams(params: ListTeamsParams): Promise<WorkflowTeamList> {
        const envelope = await this.gateway.listTeams(params);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    public async listAiModels(): Promise<AiModel[]> {
        const envelope = await this.gateway.listAiModels();
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    public async listAiTools(): Promise<AiTool[]> {
        const envelope = await this.gateway.listAiTools();
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data.map(mapAiTool);
    }
}

export const WorkflowConfigUseCases = UseCasesAbstraction.createImplementation({
    implementation: WorkflowConfigUseCasesImpl,
    dependencies: [WorkflowConfigGateway]
});
