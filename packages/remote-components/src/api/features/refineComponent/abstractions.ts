import { createAbstraction, type Result } from "@webiny/feature/api";

export interface IRefineRemoteComponentInput {
    currentSource: string;
    currentCss: string;
    feedback: string;
    additionalFileIds?: string[];
}

export interface IRefineRemoteComponentOutput {
    source: string;
    css: string;
}

type IError = Error;

export interface IRefineRemoteComponentUseCase {
    execute(
        input: IRefineRemoteComponentInput
    ): Promise<Result<IRefineRemoteComponentOutput, IError>>;
}

export const RefineRemoteComponentUseCase = createAbstraction<IRefineRemoteComponentUseCase>(
    "RemoteComponents/RefineRemoteComponentUseCase"
);

export namespace RefineRemoteComponentUseCase {
    export type Interface = IRefineRemoteComponentUseCase;
    export type Input = IRefineRemoteComponentInput;
    export type Output = IRefineRemoteComponentOutput;
    export type Error = IError;
}
