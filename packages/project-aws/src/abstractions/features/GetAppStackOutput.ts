import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import { type AppName } from "@webiny/project/abstractions/types.js";

export interface IStackOutput {
    /**
     * There is a possibility for a user to add stuff to the stack output. Pulumi outputs can be
     * objects too, for example the Cognito user pool's password policy.
     */
    [key: string]: string | string[] | undefined | number | number[] | boolean | object;
}

export type IGetAppStackOutputResult<TOutput extends IStackOutput = IStackOutput> = TOutput | null;

export interface IGetAppStackOutput {
    execute<TOutput extends IStackOutput = IStackOutput>(
        appName: AppName
    ): Promise<IGetAppStackOutputResult<TOutput>>;
}

export const GetAppStackOutput = createAbstraction<IGetAppStackOutput>("GetAppStackOutput");

export namespace GetAppStackOutput {
    export type Interface = IGetAppStackOutput;
    export type Result = IGetAppStackOutputResult;
    export type StackOutput = IStackOutput;
}
