import { createAbstraction, Result } from "@webiny/feature/api";

export interface CmsGenerateEntryContentParams {
    prompt: string;
    modelId: string;
    projectId?: string | null;
    excludedFileIds?: string[] | null;
    readerPersonaId?: string | null;
    writerPersonaId?: string | null;
    additionalFileIds?: string[] | null;
}

export interface GenerateEntryContentTelemetry {
    filesRead: string[];
    cacheHit: boolean;
    toolCallsMade: number;
    totalSteps: number;
    toolsAvailable: string[];
    imageTagsInPrompt: string[];
}

export interface GenerateEntryContentResult {
    // The generated entry values, as a JSON string. This is the transport-ready payload
    // (e.g. compressed and streamed to the Admin over websockets).
    output: string;
    // The same generated entry values, already parsed — convenient for in-process
    // consumers (e.g. a bulk action) that would otherwise JSON.parse `output`.
    values: Record<string, any>;
    telemetry: GenerateEntryContentTelemetry;
}

export interface ICmsGenerateEntryContentUseCase {
    execute(
        params: CmsGenerateEntryContentParams
    ): Promise<Result<GenerateEntryContentResult, Error>>;
}

export const CmsGenerateEntryContentUseCase = createAbstraction<ICmsGenerateEntryContentUseCase>(
    "AiPowerUpsCmsGenerateEntryContentUseCase"
);

export namespace CmsGenerateEntryContentUseCase {
    export type Interface = ICmsGenerateEntryContentUseCase;
    export type Params = CmsGenerateEntryContentParams;
}
