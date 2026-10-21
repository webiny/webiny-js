import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IListTaskParams, IListTasksResponse } from "~/api/types.js";
import type { BackgroundTaskPersistenceError } from "~/api/domain/errors.js";

type UseCaseError = BackgroundTaskPersistenceError;

export interface IListVisibleTasksUseCase {
    execute(params?: IListTaskParams): Promise<Result<IListTasksResponse, UseCaseError>>;
}

/**
 * List tasks for the GraphQL API, without the tasks of private definitions. The storage filters
 * them, so the cursor, `hasMoreItems` and `totalCount` only count visible tasks.
 */
export const ListVisibleTasksUseCase = createAbstraction<IListVisibleTasksUseCase>(
    "Tasks/ListVisibleTasksUseCase"
);

export namespace ListVisibleTasksUseCase {
    export type Interface = IListVisibleTasksUseCase;
    export type Error = UseCaseError;
}
