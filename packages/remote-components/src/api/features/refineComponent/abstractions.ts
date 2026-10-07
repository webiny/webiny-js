import { createAbstraction, type Result } from "@webiny/feature/api";
import type { GenerationTrace } from "~/api/features/generateComponent/abstractions.js";

export interface IRefineRemoteComponentInput {
    currentSource: string;
    currentCss: string;
    feedback: string;
    additionalFileIds?: string[];
    /**
     * Abandons the model call when it fires. Without one a call runs as long as the model keeps
     * writing — past the caller's own time limit, where it is killed with nothing returned.
     */
    abortSignal?: AbortSignal;
    /** Called once per model call with what was sent and what it cost, as for generation. */
    onTrace?: (trace: GenerationTrace) => void | Promise<void>;
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
