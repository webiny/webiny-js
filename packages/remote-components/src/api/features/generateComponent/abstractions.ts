import { createAbstraction, type Result } from "@webiny/feature/api";

export interface IGenerateRemoteComponentInput {
    prompt: string;
    name?: string;
    label?: string;
    description?: string;
    additionalFileIds?: string[];
    /**
     * Abandons the model call when it fires. Without one a call runs as long as the model keeps
     * writing — past the caller's own time limit, where it is killed with nothing returned.
     */
    abortSignal?: AbortSignal;
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
