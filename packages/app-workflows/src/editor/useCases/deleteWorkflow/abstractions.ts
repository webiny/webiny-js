import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";

export interface DeleteWorkflowUseCaseParams {
    // The app the workflow belongs to; the operation routes by it (R348).
    app: WorkflowAppKind;
    id: string;
}

/*
 * Deletes one workflow and resolves with the deleted one. Throws a `GraphQLOperationError` for a
 * server error (a workflow in use, one already gone) and the transport `Error` as is (R360).
 */
export interface IDeleteWorkflowUseCase {
    execute(params: DeleteWorkflowUseCaseParams): Promise<EditorWorkflow>;
}

export const DeleteWorkflowUseCase = createAbstraction<IDeleteWorkflowUseCase>(
    "Workflows/DeleteWorkflowUseCase"
);

export namespace DeleteWorkflowUseCase {
    export type Interface = IDeleteWorkflowUseCase;
    export type Params = DeleteWorkflowUseCaseParams;
}
