import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewWorkflow } from "~/review/domain/types.js";

export interface GetBoundWorkflowUseCaseParams {
    namespace: string;
}

/*
 * The workflow that binds the namespace, or `null` when none does. The workflow list is read once
 * per app and cached by `ReviewRepository` until a store or a delete clears it (R350). Throws a
 * `GraphQLOperationError` for a server error and the transport `Error` as is (R360).
 */
export interface IGetBoundWorkflowUseCase {
    execute(params: GetBoundWorkflowUseCaseParams): Promise<ReviewWorkflow | null>;
}

export const GetBoundWorkflowUseCase = createAbstraction<IGetBoundWorkflowUseCase>(
    "Workflows/GetBoundWorkflowUseCase"
);

export namespace GetBoundWorkflowUseCase {
    export type Interface = IGetBoundWorkflowUseCase;
    export type Params = GetBoundWorkflowUseCaseParams;
}
