import { createAbstraction } from "@webiny/feature/admin";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";
import type { DeleteWorkflowUseCase } from "~/editor/useCases/deleteWorkflow/abstractions.js";
import type { FolderExistsUseCase } from "~/editor/useCases/folderExists/abstractions.js";
import type { GetWorkflowUseCase } from "~/editor/useCases/getWorkflow/abstractions.js";
import type { InspectRoutingUseCase } from "~/editor/useCases/inspectRouting/abstractions.js";
import type { ListWorkflowModelsUseCase } from "~/editor/useCases/listWorkflowModels/abstractions.js";
import type { StoreWorkflowUseCase } from "~/editor/useCases/storeWorkflow/abstractions.js";

/*
 * The editor's area repository (R343): it calls `WorkflowEditorGateway` and maps the DTOs to the
 * editor's domain types. No cache. It lets every error of the gateway pass as it is.
 */
export interface IWorkflowEditorRepository {
    listModels(params: ListWorkflowModelsUseCase.Params): Promise<WorkflowModelPage>;
    getWorkflow(params: GetWorkflowUseCase.Params): Promise<EditorWorkflow>;
    storeWorkflow(params: StoreWorkflowUseCase.Params): Promise<EditorWorkflow>;
    deleteWorkflow(params: DeleteWorkflowUseCase.Params): Promise<EditorWorkflow>;
    inspectRouting(params: InspectRoutingUseCase.Params): Promise<RoutingInspection>;
    folderExists(params: FolderExistsUseCase.Params): Promise<boolean>;
}

export const WorkflowEditorRepository = createAbstraction<IWorkflowEditorRepository>(
    "Workflows/WorkflowEditorRepository"
);

export namespace WorkflowEditorRepository {
    export type Interface = IWorkflowEditorRepository;
}
