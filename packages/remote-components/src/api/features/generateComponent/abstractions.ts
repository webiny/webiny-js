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
    /**
     * Called once per model call — after it returns, fails or is cut off — with what was sent and what
     * it cost, for a caller that keeps a log of its attempts. A failure in the callback is ignored.
     */
    onTrace?: (trace: GenerationTrace) => void | Promise<void>;
}

/** One model call, as sent and as answered. */
export interface GenerationTrace {
    /** The model as the provider named it, e.g. `anthropic/claude-sonnet-5`. */
    model: string;
    /** The system prompt, whole. */
    system: string;
    /** The user message's text, whole. */
    user: string;
    /** The File Manager ids of the images sent with it. */
    imageFileIds: string[];
    durationMs: number;
    /** Absent when the call failed or was cut off — the provider reports no usage for those. */
    usage?: {
        inputTokens: number;
        outputTokens: number;
        cacheReadTokens: number;
        cacheWriteTokens: number;
    };
    /** Why the model stopped: `stop`, `length` (hit the output cap)… */
    finishReason?: string;
    /** Length of the answer, in characters. */
    outputChars?: number;
    /** Why the call failed or was cut off. */
    error?: string;
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
