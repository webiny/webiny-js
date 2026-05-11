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

export interface IWbGeneratePageContentUseCase {
    execute(params: WbGeneratePageContentParams): Promise<Result<string, Error>>;
}

export const WbGeneratePageContentUseCase = createAbstraction<IWbGeneratePageContentUseCase>(
    "AiPowerUpsWbGeneratePageContentUseCase"
);

export namespace WbGeneratePageContentUseCase {
    export type Interface = IWbGeneratePageContentUseCase;
    export type Params = WbGeneratePageContentParams;
}
