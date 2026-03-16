import { createAbstraction, Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { ScheduledActionType } from "~/shared/abstractions.js";
import { NamespaceHandlerNotFoundError } from "~/domain/errors.js";

export interface INamespaceHandlerErrors {
    notFound: NamespaceHandlerNotFoundError;
}

type NamespaceHandlerError = INamespaceHandlerErrors[keyof INamespaceHandlerErrors];
/**
 * Handling of specific app.
 */
export interface INamespaceHandlerParams {
    scheduleId: string;
    targetId: string;
    actionType: ScheduledActionType;
    namespace: string;
    immediately: boolean | undefined;
    scheduleFor: Date;
}

export type INamespaceHandlerResult<T extends GenericRecord = GenericRecord> = T & {
    title: string;
    targetId: string;
    actionType: ScheduledActionType;
    namespace: string;
    scheduleId: string;
};

export interface INamespaceHandler<T extends GenericRecord = GenericRecord> {
    canHandle(namespace: string): boolean;
    execute(
        params: INamespaceHandlerParams
    ): Promise<Result<INamespaceHandlerResult<T>, NamespaceHandlerError>>;
}

export const NamespaceHandler = createAbstraction<INamespaceHandler>("Scheduler/NamespaceHandler");

export namespace NamespaceHandler {
    export type Interface<T extends GenericRecord> = INamespaceHandler<T>;
    export type Response<T extends GenericRecord> = Promise<Result<INamespaceHandlerResult<T>, NamespaceHandlerError>>;
    export type Params = INamespaceHandlerParams;
}

/**
 * Executioner of the app handlers.
 */

export interface INamespaceHandlerExecutioner {
    execute<T extends GenericRecord = GenericRecord>(
        params: INamespaceHandlerParams
    ): Promise<Result<INamespaceHandlerResult<T>, NamespaceHandlerError>>;
}

export const NamespaceHandlerExecutioner = createAbstraction<INamespaceHandlerExecutioner>(
    "Scheduler/NamespaceHandlerExecutioner"
);

export namespace NamespaceHandlerExecutioner {
    export type Interface = INamespaceHandlerExecutioner;
    export type Response = Promise<Result<INamespaceHandlerResult, NamespaceHandlerError>>;
    export type Params = INamespaceHandlerParams;
}
