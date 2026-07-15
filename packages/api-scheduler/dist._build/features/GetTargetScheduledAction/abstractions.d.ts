import { Result } from "@webiny/feature/api";
import type { IScheduledAction } from "~/shared/abstractions.js";
import { ScheduledActionNotFoundError, ScheduledActionPersistenceError, NotAuthorizedError } from "~/domain/errors.js";
import type { GenericRecord } from "@webiny/api/types.js";
export interface IGetTargetScheduledActionErrors {
    persistence: ScheduledActionPersistenceError;
    notFound: ScheduledActionNotFoundError;
    unauthorized: NotAuthorizedError;
}
type GetTargetScheduledActionError = IGetTargetScheduledActionErrors[keyof IGetTargetScheduledActionErrors];
export interface IGetTargetScheduledActionUseCaseParams {
    namespace: string;
    id: string;
}
export interface IGetTargetScheduledActionUseCase {
    execute<T extends GenericRecord>(params: IGetTargetScheduledActionUseCaseParams): Promise<Result<IScheduledAction<T>, GetTargetScheduledActionError>>;
}
export declare const GetTargetScheduledActionUseCase: import("@webiny/di").Abstraction<IGetTargetScheduledActionUseCase>;
export declare namespace GetTargetScheduledActionUseCase {
    type Interface = IGetTargetScheduledActionUseCase;
    type Error = GetTargetScheduledActionError;
    type Params = IGetTargetScheduledActionUseCaseParams;
}
export {};
