import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IListTaskLogParams, IListTaskLogsResponse } from "~/api/types.js";
import type { BackgroundTaskPersistenceError } from "~/api/domain/errors.js";

type UseCaseError = BackgroundTaskPersistenceError;

export interface IListVisibleTaskLogsUseCase {
    execute(params: IListTaskLogParams): Promise<Result<IListTaskLogsResponse, UseCaseError>>;
}

/** List task logs for the GraphQL API, without the logs of tasks of private definitions. */
export const ListVisibleTaskLogsUseCase = createAbstraction<IListVisibleTaskLogsUseCase>(
    "Tasks/ListVisibleTaskLogsUseCase"
);

export namespace ListVisibleTaskLogsUseCase {
    export type Interface = IListVisibleTaskLogsUseCase;
    export type Error = UseCaseError;
}
