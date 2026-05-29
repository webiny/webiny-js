import { createAbstraction } from "webiny/admin";
import type { MLCEngineInterface, InitProgressReport } from "@mlc-ai/web-llm";

export type WebLlmStatus = "idle" | "loading" | "ready" | "error";

export interface IWebLlmService {
    readonly status: WebLlmStatus;
    readonly engine: MLCEngineInterface | null;
    readonly progress: InitProgressReport | null;
    readonly error: string | null;
    loadModel(modelId?: string): Promise<void>;
    unloadModel(): Promise<void>;
}

export const WebLlmService = createAbstraction<IWebLlmService>("WebLlmService");

export namespace WebLlmService {
    export type Interface = IWebLlmService;
}
