import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { ITask } from "~/api/types.js";
import type { AbortTaskUseCase } from "~/api/features/AbortTask/abstractions.js";

type UseCaseError = AbortTaskUseCase.Error;

export interface IAbortVisibleTaskUseCase {
    execute(params: AbortTaskUseCase.Params): Promise<Result<ITask, UseCaseError>>;
}

/** Abort a task from the GraphQL API. A task of a private definition fails like a missing one. */
export const AbortVisibleTaskUseCase = createAbstraction<IAbortVisibleTaskUseCase>(
    "Tasks/AbortVisibleTaskUseCase"
);

export namespace AbortVisibleTaskUseCase {
    export type Interface = IAbortVisibleTaskUseCase;
    export type Error = UseCaseError;
}
