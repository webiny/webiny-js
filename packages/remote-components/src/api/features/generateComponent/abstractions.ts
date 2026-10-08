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
     * Called once per model call — after it returns, fails or is cut off — with what was sent, what
     * came back (partially, if cut off) and what it cost, for a caller that keeps a log of its attempts. A failure in the callback is ignored.
     */
    onTrace?: (trace: GenerationTrace) => void | Promise<void>;
    /**
     * System prompt lines to leave out, by id (`SYSTEM_PROMPT_LINE_IDS`): for a prompt experiment, or
     * as a caller's own override of a line measured dead for it. Other callers keep the line.
     */
    ablate?: readonly string[];
    /** A caller's own theme vocabulary for the system prompt; see `BuildComponentPromptOptions`. */
    tokenCatalog?: string;
    /** Rewrites the worked examples' variables into the caller's theme; see `BuildComponentPromptOptions`. */
    rewriteExampleVariable?: (variable: string, fallback: string) => string | null;
}

/** One model call, as sent and as answered. */
export interface GenerationTrace {
    /** The model as the provider named it, e.g. `anthropic/claude-sonnet-5`. */
    model: string;
    /** The system prompt, whole. */
    system: string;
    /** The user message's text, whole. */
    user: string;
    /** The File Manager ids of the images asked to be sent with it. */
    imageFileIds: string[];
    /**
     * The image parts actually placed in the request. An id whose file could not be read, or is not an
     * image, is dropped without an error — so this, not `imageFileIds`, says whether the model saw it.
     */
    imagesAttached: { mediaType: string; bytes: number }[];
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
    /**
     * The text the model had written when the call failed or was cut off. The provider reports token
     * usage only when the answer ends, so for a cut-off call this and `stream` are all there is.
     */
    partialOutput?: string;
    /**
     * When the answer's chunks arrived, from the start of the call. A call that streams to its limit
     * is writing that much; one whose last chunk is long before its end stalled.
     */
    stream?: {
        firstChunkMs: number | null;
        lastChunkMs: number | null;
        chunks: number;
        reasoningChars: number;
    };
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
