import { Abstraction } from "@webiny/di";
import { type IBaseAppParams } from "~/abstractions/types.js";

export type IGetAppStackOutputParams = IBaseAppParams;

export interface IStackOutput {
    /**
     * There is a possibility for a user to add stuff to the stack output.
     */
    [key: string]: string | string[] | undefined | number | number[] | boolean;
}

// This interface is later extended in downstream packages (e.g., @webiny/project-aws).
// TODO: because some of these are AWS specific, we should consider moving these to
// TODO: @webiny/project-aws. Would've done it, but didn't have time.
export interface ICoreStackOutput extends IStackOutput {
    deploymentId: string;
    iotAuthorizerName: string;
}

export type IGetAppStackOutputResult<TOutput extends IStackOutput = IStackOutput> = TOutput | null;

export interface IGetAppStackOutput {
    execute<TOutput extends IStackOutput = IStackOutput>(
        params: IGetAppStackOutputParams
    ): Promise<IGetAppStackOutputResult<TOutput>>;
}

export const GetAppStackOutput = new Abstraction<IGetAppStackOutput>("GetAppStackOutput");

export namespace GetAppStackOutput {
    export type Interface = IGetAppStackOutput;

    export type Params = IGetAppStackOutputParams;
    export type Result = IGetAppStackOutputResult;
    export type StackOutput = IStackOutput;
}
