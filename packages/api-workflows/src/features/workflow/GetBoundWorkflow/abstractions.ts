import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow } from "~/domain/workflow/types.js";
import type { WorkflowPersistenceError } from "~/domain/workflow/errors.js";

export interface GetBoundWorkflowInput {
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
}

export interface IGetBoundWorkflowUseCaseErrors {
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IGetBoundWorkflowUseCaseErrors[keyof IGetBoundWorkflowUseCaseErrors];

export interface IGetBoundWorkflowUseCase {
    execute(input: GetBoundWorkflowInput): Promise<Result<Workflow | null, UseCaseError>>;
}

/**
 * The workflow bound to a namespace, or `null` (v1 binds at most one, D15). Internal (D132): the
 * app adapters' rules ask it first, so unbound models never look up reviews (D134, R54).
 *
 * Two accepted races. On OpenSearch a just-created workflow may not be listed yet, so for that
 * window its model reads as unbound (the callers fail open). If two workflows bind one model, the
 * oldest wins.
 */
export const GetBoundWorkflowUseCase =
    createAbstraction<IGetBoundWorkflowUseCase>("GetBoundWorkflowUseCase");

export namespace GetBoundWorkflowUseCase {
    export type Interface = IGetBoundWorkflowUseCase;
    export type Input = GetBoundWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow | null, UseCaseError>>;
}
