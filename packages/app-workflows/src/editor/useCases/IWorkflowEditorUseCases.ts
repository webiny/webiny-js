import type { ListWorkflowModelsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
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
}
