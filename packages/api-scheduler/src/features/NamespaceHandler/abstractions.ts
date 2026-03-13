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
    scheduleFor: string | undefined;
}

export type INamespaceHandlerResult = GenericRecord & {
    title: string;
    targetId: string;
    actionType: ScheduledActionType;
    namespace: string;
    scheduleId: string;
};

export interface INamespaceHandler {
    canHandle(namespace: string): boolean;
    execute(
        params: INamespaceHandlerParams
    ): Promise<Result<INamespaceHandlerResult, NamespaceHandlerError>>;
}

export const NamespaceHandler = createAbstraction<INamespaceHandler>("Scheduler/NamespaceHandler");

export namespace NamespaceHandler {
    export type Interface = INamespaceHandler;
    export type Response = Promise<Result<INamespaceHandlerResult, NamespaceHandlerError>>;
    export type Params = INamespaceHandlerParams;
}

/**
 * Executioner of the app handlers.
 */

export interface INamespaceHandlerExecutioner {
    execute(
        params: INamespaceHandlerParams
    ): Promise<Result<INamespaceHandlerResult, NamespaceHandlerError>>;
}

export const NamespaceHandlerExecutioner = createAbstraction<INamespaceHandlerExecutioner>(
    "Scheduler/NamespaceHandlerExecutioner"
);

export namespace NamespaceHandlerExecutioner {
    export type Interface = INamespaceHandlerExecutioner;
    export type Response = Promise<Result<INamespaceHandlerResult, NamespaceHandlerError>>;
    export type Params = INamespaceHandlerParams;
}
