import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IListTaskLogParams } from "~/api/types.js";
import type { IListTaskLogsResponse } from "~/api/types.js";
import type { BackgroundTaskPersistenceError } from "~/api/domain/errors.js";

type UseCaseError = BackgroundTaskPersistenceError;

export interface IListTaskLogsUseCase {
    execute(params: IListTaskLogParams): Promise<Result<IListTaskLogsResponse, UseCaseError>>;
}

/** List task logs. */
export const ListTaskLogsUseCase = createAbstraction<IListTaskLogsUseCase>(
    "Tasks/ListTaskLogsUseCase"
);

export namespace ListTaskLogsUseCase {
    export type Interface = IListTaskLogsUseCase;
    export type Error = UseCaseError;
}
