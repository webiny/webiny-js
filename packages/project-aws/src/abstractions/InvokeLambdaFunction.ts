import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";

export interface IInvokeLambdaFunctionParams {
    functionName: string;
    payload: Record<string, any>;
    invocationType?: "RequestResponse" | "Event";
}

export interface IInvokeLambdaFunctionResult<T = any> {
    statusCode?: number;
    payload: T;
}

export interface IInvokeLambdaFunction {
    execute<T = any>(params: IInvokeLambdaFunctionParams): Promise<IInvokeLambdaFunctionResult<T>>;
}

export const InvokeLambdaFunction =
    createAbstraction<IInvokeLambdaFunction>("InvokeLambdaFunction");

export namespace InvokeLambdaFunction {
    export type Interface = IInvokeLambdaFunction;
    export type Params = IInvokeLambdaFunctionParams;
    export type Result<T = any> = IInvokeLambdaFunctionResult<T>;
}
