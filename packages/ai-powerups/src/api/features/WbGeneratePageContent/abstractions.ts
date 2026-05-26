import { createAbstraction, Result } from "@webiny/feature/api";

export interface WbGeneratePageContentParams {
    prompt: string;
    components: unknown;
    tools: unknown;
    projectId?: string | null;
    excludedFileIds?: string[] | null;
    readerPersonaId?: string | null;
    writerPersonaId?: string | null;
}

export interface GenerationTelemetry {
    filesRead: string[];
    cacheHit: boolean;
    toolCallsMade: number;
    totalSteps: number;
    toolsAvailable: string[];
    imageTagsInPrompt: string[];
}

export interface GeneratePageContentResult {
    output: string;
    telemetry: GenerationTelemetry;
}

export interface IWbGeneratePageContentUseCase {
    execute(params: WbGeneratePageContentParams): Promise<Result<GeneratePageContentResult, Error>>;
}

export const WbGeneratePageContentUseCase = createAbstraction<IWbGeneratePageContentUseCase>(
    "AiPowerUpsWbGeneratePageContentUseCase"
);

export namespace WbGeneratePageContentUseCase {
    export type Interface = IWbGeneratePageContentUseCase;
    export type Params = WbGeneratePageContentParams;
}
