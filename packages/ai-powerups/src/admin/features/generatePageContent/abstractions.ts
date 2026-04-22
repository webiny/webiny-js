import { createAbstraction } from "@webiny/feature/admin";

export interface GeneratePageContentParams {
    prompt: string;
    components: unknown;
    tools: unknown;
}

export interface IGeneratePageContentUseCase {
    execute(params: GeneratePageContentParams): Promise<void>;
}

export const GeneratePageContentUseCase = createAbstraction<IGeneratePageContentUseCase>(
    "AiPowerUps/GeneratePageContentUseCase"
);

export namespace GeneratePageContentUseCase {
    export type Interface = IGeneratePageContentUseCase;
    export type Params = GeneratePageContentParams;
}

export interface IGeneratePageContentGateway {
    execute(params: GeneratePageContentParams): Promise<void>;
}

export const GeneratePageContentGateway = createAbstraction<IGeneratePageContentGateway>(
    "AiPowerUps/GeneratePageContentGateway"
);

export namespace GeneratePageContentGateway {
    export type Interface = IGeneratePageContentGateway;
}
