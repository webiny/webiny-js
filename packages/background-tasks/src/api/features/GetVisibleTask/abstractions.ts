import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { ITask } from "~/api/types.js";
import type { BackgroundTaskPersistenceError, TaskNotFoundError } from "~/api/domain/errors.js";

type UseCaseError = TaskNotFoundError | BackgroundTaskPersistenceError;

export interface IGetVisibleTaskUseCase {
    execute(id: string): Promise<Result<ITask, UseCaseError>>;
}

/** Get a task for the GraphQL API. A task of a private definition fails like a missing one. */
export const GetVisibleTaskUseCase = createAbstraction<IGetVisibleTaskUseCase>(
    "Tasks/GetVisibleTaskUseCase"
);

export namespace GetVisibleTaskUseCase {
    export type Interface = IGetVisibleTaskUseCase;
    export type Error = UseCaseError;
}
