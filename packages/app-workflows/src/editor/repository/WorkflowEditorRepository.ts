import type { EditorWorkflow } from "~/editor/domain/types.js";
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";
import { WorkflowEditorGateway } from "~/editor/gateway/abstractions.js";
import { mapEditorWorkflow } from "~/editor/gateway/mapEditorWorkflow.js";
import { mapRoutingInspection } from "~/editor/gateway/mapRoutingInspection.js";
import { mapWorkflowModelPage } from "~/editor/gateway/mapWorkflowModelPage.js";
import type { DeleteWorkflowUseCase } from "~/editor/useCases/deleteWorkflow/abstractions.js";
import type { FolderExistsUseCase } from "~/editor/useCases/folderExists/abstractions.js";
import type { GetWorkflowUseCase } from "~/editor/useCases/getWorkflow/abstractions.js";
import type { InspectRoutingUseCase } from "~/editor/useCases/inspectRouting/abstractions.js";
import type { ListWorkflowModelsUseCase } from "~/editor/useCases/listWorkflowModels/abstractions.js";
import type { StoreWorkflowUseCase } from "~/editor/useCases/storeWorkflow/abstractions.js";
import { WorkflowEditorRepository as RepositoryAbstraction } from "./abstractions.js";

class WorkflowEditorRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: WorkflowEditorGateway.Interface) {}

    async listModels(params: ListWorkflowModelsUseCase.Params): Promise<WorkflowModelPage> {
        const dto = await this.gateway.listModels(params);
        return mapWorkflowModelPage(dto);
    }

    async getWorkflow(params: GetWorkflowUseCase.Params): Promise<EditorWorkflow> {
        const dto = await this.gateway.getWorkflow(params);
        return mapEditorWorkflow(dto);
    }

    async storeWorkflow(params: StoreWorkflowUseCase.Params): Promise<EditorWorkflow> {
        const dto = await this.gateway.storeWorkflow(params);
        return mapEditorWorkflow(dto);
    }

    async deleteWorkflow(params: DeleteWorkflowUseCase.Params): Promise<EditorWorkflow> {
        const dto = await this.gateway.deleteWorkflow(params);
        return mapEditorWorkflow(dto);
    }

    async inspectRouting(params: InspectRoutingUseCase.Params): Promise<RoutingInspection> {
        const dto = await this.gateway.inspectRouting(params);
        return mapRoutingInspection(dto);
    }

    async folderExists(params: FolderExistsUseCase.Params): Promise<boolean> {
        return this.gateway.folderExists(params);
    }
}

export const WorkflowEditorRepository = RepositoryAbstraction.createImplementation({
    implementation: WorkflowEditorRepositoryImpl,
    dependencies: [WorkflowEditorGateway]
});
