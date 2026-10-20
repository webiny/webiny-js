import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";

export interface DeleteWorkflowUseCaseParams {
    // The app the workflow belongs to; the operation routes by it (R348).
    app: WorkflowAppKind;
    id: string;
}

/*
 * Deletes a workflow of the app. After the delete succeeds, and when the workflow was already
 * gone, it clears the app's cached review workflow list (R350). Throws a `GraphQLOperationError`
 * for a server error and the transport `Error` as is (R360).
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
