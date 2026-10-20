import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { StoreWorkflowParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";

export interface StoreWorkflowUseCaseParams extends StoreWorkflowParams {
    // The app the workflow belongs to; the operation routes by it (R348).
    app: WorkflowAppKind;
}

/*
 * Stores a new or a changed workflow and resolves with the stored one. Throws a
 * `GraphQLOperationError` for a server error (a conflict, a validation error, a duplicate binding)
 * and the transport `Error` as is (R360).
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
