import { createAbstraction } from "@webiny/feature/admin";
import type { EditorWorkflowDto } from "./dto.js";
import type { RoutingInspectionDto } from "./dto.js";
import type { WorkflowModelPageDto } from "./dto.js";
import type { DeleteWorkflowUseCase } from "~/editor/useCases/deleteWorkflow/abstractions.js";
import type { FolderExistsUseCase } from "~/editor/useCases/folderExists/abstractions.js";
import type { GetWorkflowUseCase } from "~/editor/useCases/getWorkflow/abstractions.js";
import type { InspectRoutingUseCase } from "~/editor/useCases/inspectRouting/abstractions.js";
import type { ListWorkflowModelsUseCase } from "~/editor/useCases/listWorkflowModels/abstractions.js";
import type { StoreWorkflowUseCase } from "~/editor/useCases/storeWorkflow/abstractions.js";

/*
 * The editor's area gateway (R343, R347): it hands each operation to the app gateway registered
 * for `params.app`, unwraps the envelope and returns the DTO. It throws a `GraphQLOperationError`
 * for an error envelope or a missing answer (R346) and lets the transport `Error`, and a plain
 * `Error` of the app gateway or of an app nobody registered, pass as they are. `folderExists`
 * resolves `false` as an answer.
 */
export interface IWorkflowEditorGateway {
    listModels(params: ListWorkflowModelsUseCase.Params): Promise<WorkflowModelPageDto>;
    getWorkflow(params: GetWorkflowUseCase.Params): Promise<EditorWorkflowDto>;
    storeWorkflow(params: StoreWorkflowUseCase.Params): Promise<EditorWorkflowDto>;
    deleteWorkflow(params: DeleteWorkflowUseCase.Params): Promise<EditorWorkflowDto>;
    inspectRouting(params: InspectRoutingUseCase.Params): Promise<RoutingInspectionDto>;
    folderExists(params: FolderExistsUseCase.Params): Promise<boolean>;
}

export const WorkflowEditorGateway = createAbstraction<IWorkflowEditorGateway>(
    "Workflows/WorkflowEditorGateway"
);

export namespace WorkflowEditorGateway {
    export type Interface = IWorkflowEditorGateway;
}
