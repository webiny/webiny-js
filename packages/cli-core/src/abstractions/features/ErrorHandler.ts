import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { Command } from "~/abstractions/index.js";

export type IError = Error;

export interface IErrorHandlerParams<TParams> {
    error: Error;
    command: Command.CommandDefinition<any>;
    params: TParams;
}

export interface IErrorHandler<TParams> {
    execute(params: IErrorHandlerParams<TParams>): void;
}

export const ErrorHandler = createAbstraction<IErrorHandler<any>>("ErrorHandler");

export namespace ErrorHandler {
    export type Interface<TParams> = IErrorHandler<TParams>;
    export type Params<TParams> = IErrorHandlerParams<TParams>;
}
