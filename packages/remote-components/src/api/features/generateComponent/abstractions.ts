import { createAbstraction, type Result } from "@webiny/feature/api";

export interface IGenerateRemoteComponentInput {
    prompt: string;
    name?: string;
    label?: string;
    description?: string;
    additionalFileIds?: string[];
}

export interface IGenerateRemoteComponentOutput {
    source: string;
    css: string;
    name: string;
    label: string;
    description: string;
    aiContext: string;
}

type IError = Error;

export interface IGenerateRemoteComponentUseCase {
    execute(
        input: IGenerateRemoteComponentInput
    ): Promise<Result<IGenerateRemoteComponentOutput, IError>>;
}

export const GenerateRemoteComponentUseCase = createAbstraction<IGenerateRemoteComponentUseCase>(
    "RemoteComponents/GenerateRemoteComponentUseCase"
);

export namespace GenerateRemoteComponentUseCase {
    export type Interface = IGenerateRemoteComponentUseCase;
    export type Input = IGenerateRemoteComponentInput;
    export type Output = IGenerateRemoteComponentOutput;
    export type Error = IError;
}
