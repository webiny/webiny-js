import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow } from "@webiny/api-workflows/domain/workflow/types.js";
import type { WorkflowsNotAuthenticatedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";

export interface GetWebsiteBuilderPageWorkflowInput {
    id: string;
}

export interface IGetWebsiteBuilderPageWorkflowUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    get: GetWorkflowUseCase.Error;
}

type UseCaseError =
    IGetWebsiteBuilderPageWorkflowUseCaseErrors[keyof IGetWebsiteBuilderPageWorkflowUseCaseErrors];

export interface IGetWebsiteBuilderPageWorkflowUseCase {
    execute(input: GetWebsiteBuilderPageWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/** One pages workflow, for any signed-in identity (D78); another app's is not found (R46). */
export const GetWebsiteBuilderPageWorkflowUseCase =
    createAbstraction<IGetWebsiteBuilderPageWorkflowUseCase>(
        "GetWebsiteBuilderPageWorkflowUseCase"
    );

export namespace GetWebsiteBuilderPageWorkflowUseCase {
    export type Interface = IGetWebsiteBuilderPageWorkflowUseCase;
    export type Input = GetWebsiteBuilderPageWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
