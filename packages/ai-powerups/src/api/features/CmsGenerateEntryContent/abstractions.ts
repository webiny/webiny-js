import { createAbstraction, Result } from "@webiny/feature/api";

export interface CmsGenerateEntryContentParams {
    prompt: string;
    modelId: string;
    projectId?: string | null;
    excludedFileIds?: string[] | null;
    readerPersonaId?: string | null;
    writerPersonaId?: string | null;
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
    output: string;
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
