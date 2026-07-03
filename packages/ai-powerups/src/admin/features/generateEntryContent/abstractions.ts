import { createAbstraction } from "@webiny/feature/admin";

export interface GenerateEntryContentParams {
    prompt: string;
    modelId: string;
    projectId?: string | null;
    excludedFileIds?: string[] | null;
    readerPersonaId?: string | null;
    writerPersonaId?: string | null;
}

export interface IGenerateEntryContentUseCase {
    execute(params: GenerateEntryContentParams): Promise<void>;
}

export const GenerateEntryContentUseCase = createAbstraction<IGenerateEntryContentUseCase>(
    "AiPowerUps/GenerateEntryContentUseCase"
);

export namespace GenerateEntryContentUseCase {
    export type Interface = IGenerateEntryContentUseCase;
    export type Params = GenerateEntryContentParams;
}

export interface IGenerateEntryContentGateway {
    execute(params: GenerateEntryContentParams): Promise<void>;
}

export const GenerateEntryContentGateway = createAbstraction<IGenerateEntryContentGateway>(
    "AiPowerUps/GenerateEntryContentGateway"
);

export namespace GenerateEntryContentGateway {
    export type Interface = IGenerateEntryContentGateway;
}
