import { createAbstraction, Result } from "@webiny/feature/api";
import type { IScheduledAction } from "~/shared/abstractions.js";
import {
    ScheduledActionNotFoundError,
    ScheduledActionPersistenceError,
    NotAuthorizedError
} from "~/domain/errors.js";
import type { GenericRecord } from "@webiny/api/types.js";

/**
 * GetScheduledActionUseCase - Retrieve a scheduled action by ID
 *
 * Used to check if a schedule exists (for reschedule logic) and to retrieve
 * schedule details for display/management purposes.
 *
 * Returns null value (Result.ok(null)) if schedule not found.
 */

export interface IGetScheduledActionErrors {
    persistence: ScheduledActionPersistenceError;
    notFound: ScheduledActionNotFoundError;
    unauthorized: NotAuthorizedError;
}

type GetScheduledActionError = IGetScheduledActionErrors[keyof IGetScheduledActionErrors];

export interface IGetScheduledActionUseCaseParams {
    namespace: string;
    id: string;
}

export interface IGetScheduledActionUseCase {
    execute<T extends GenericRecord>(
        params: IGetScheduledActionUseCaseParams
    ): Promise<Result<IScheduledAction<T>, GetScheduledActionError>>;
}

export const GetScheduledActionUseCase = createAbstraction<IGetScheduledActionUseCase>(
    "Scheduler/GetScheduledActionUseCase"
);

export namespace GetScheduledActionUseCase {
    export type Interface = IGetScheduledActionUseCase;
    export type Error = GetScheduledActionError;
    export type Params = IGetScheduledActionUseCaseParams;
}
