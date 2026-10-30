import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";

export interface GetWorkflowUseCaseParams {
    // The app the workflow belongs to; the operation routes by it (R348).
    app: WorkflowAppKind;
    id: string;
}

/*
 * One workflow by id. Throws a `GraphQLOperationError` for a server error (its `code` is a
 * `WorkflowErrorCode`) and the transport `Error` as is (R360).
 */
export interface IGetWorkflowUseCase {
    execute(params: GetWorkflowUseCaseParams): Promise<EditorWorkflow>;
}

export const GetWorkflowUseCase = createAbstraction<IGetWorkflowUseCase>(
    "Workflows/GetWorkflowUseCase"
);

export namespace GetWorkflowUseCase {
    export type Interface = IGetWorkflowUseCase;
    export type Params = GetWorkflowUseCaseParams;
}
