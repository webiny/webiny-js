import type { FolderExistsParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { InspectRoutingParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { ListWorkflowModelsParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { StoreWorkflowParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";

/*
 * What the editor needs from one app. Every method throws a `GraphQLOperationError` for a server
 * error (its `code` is a `WorkflowErrorCode`) or the transport `Error` as is (R204).
 */
export interface IWorkflowEditorUseCases {
    listModels(params: ListWorkflowModelsParams): Promise<WorkflowModelPage>;
    getWorkflow(id: string): Promise<EditorWorkflow>;
    storeWorkflow(params: StoreWorkflowParams): Promise<EditorWorkflow>;
    // Resolves with the deleted workflow.
    deleteWorkflow(id: string): Promise<EditorWorkflow>;
    // What routing would do with the unsaved step config; the editor composes the sentences (R301).
    inspectRouting(params: InspectRoutingParams): Promise<RoutingInspection>;
    // `false` is an answer (the folder was deleted), not an error.
    folderExists(params: FolderExistsParams): Promise<boolean>;
}
