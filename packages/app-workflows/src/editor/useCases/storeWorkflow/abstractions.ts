import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { StoreWorkflowParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";

export interface StoreWorkflowUseCaseParams extends StoreWorkflowParams {
    // The app the workflow belongs to; the operation routes by it (R348).
    app: WorkflowAppKind;
}

/*
 * Stores a workflow of the app. After the store succeeds, and when the server says the workflow
 * is gone, it clears the app's cached review workflow list (R350). Throws a
 * `GraphQLOperationError` for a server error and the transport `Error` as is (R360).
 */
export interface IStoreWorkflowUseCase {
    execute(params: StoreWorkflowUseCaseParams): Promise<EditorWorkflow>;
}

export const StoreWorkflowUseCase = createAbstraction<IStoreWorkflowUseCase>(
    "Workflows/StoreWorkflowUseCase"
);

export namespace StoreWorkflowUseCase {
    export type Interface = IStoreWorkflowUseCase;
    export type Params = StoreWorkflowUseCaseParams;
}
