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

export interface GenerateEntryContentResult<TValues = Record<string, any>> {
    /**
     * The generated entry values, keyed by fieldId. Callers that consume the result
     * directly (e.g. a bulk action) can read fields straight off this object; transport
     * edges (the background task / websocket stream) serialize it themselves. Pass a type
     * argument to `execute` to shape this (e.g. `execute<{ aiSummary?: string }>`).
     */
    values: TValues;
    telemetry: GenerateEntryContentTelemetry;
}

export interface ICmsGenerateEntryContentUseCase {
    execute<TValues = Record<string, any>>(
        params: CmsGenerateEntryContentParams
    ): Promise<Result<GenerateEntryContentResult<TValues>, Error>>;
}

export const CmsGenerateEntryContentUseCase = createAbstraction<ICmsGenerateEntryContentUseCase>(
    "AiPowerUpsCmsGenerateEntryContentUseCase"
);

export namespace CmsGenerateEntryContentUseCase {
    export type Interface = ICmsGenerateEntryContentUseCase;
    export type Params = CmsGenerateEntryContentParams;
}
