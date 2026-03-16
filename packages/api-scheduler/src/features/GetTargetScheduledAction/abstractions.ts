import { createAbstraction, Result } from "@webiny/feature/api";
import type { IScheduledAction } from "~/shared/abstractions.js";
import {
    ScheduledActionNotFoundError,
    ScheduledActionPersistenceError,
    NotAuthorizedError
} from "~/domain/errors.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IGetTargetScheduledActionErrors {
    persistence: ScheduledActionPersistenceError;
    notFound: ScheduledActionNotFoundError;
    unauthorized: NotAuthorizedError;
}

type GetTargetScheduledActionError =
    IGetTargetScheduledActionErrors[keyof IGetTargetScheduledActionErrors];

export interface IGetTargetScheduledActionUseCaseParams {
    namespace: string;
    id: string;
}

export interface IGetTargetScheduledActionUseCase {
    execute<T extends GenericRecord>(
        params: IGetTargetScheduledActionUseCaseParams
    ): Promise<Result<IScheduledAction<T>, GetTargetScheduledActionError>>;
}

export const GetTargetScheduledActionUseCase = createAbstraction<IGetTargetScheduledActionUseCase>(
    "Scheduler/GetTargetScheduledActionUseCase"
);

export namespace GetTargetScheduledActionUseCase {
    export type Interface = IGetTargetScheduledActionUseCase;
    export type Error = GetTargetScheduledActionError;
    export type Params = IGetTargetScheduledActionUseCaseParams;
}
