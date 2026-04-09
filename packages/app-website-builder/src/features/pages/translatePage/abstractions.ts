import { createAbstraction } from "@webiny/feature/admin";

export interface TranslatedPageDto {
    id: string;
}

//
// Params
//
export interface TranslatePageParams {
    id: string;
    languageCode: string;
    folderId: string;
}

//
// UseCase
//
export interface ITranslatePageUseCase {
    execute(params: TranslatePageParams): Promise<TranslatedPageDto>;
}

export const TranslatePageUseCase = createAbstraction<ITranslatePageUseCase>(
    "WebsiteBuilder/TranslatePageUseCase"
);

export namespace TranslatePageUseCase {
    export type Interface = ITranslatePageUseCase;
    export type Params = TranslatePageParams;
}

//
// Repository
//
export interface ITranslatePageRepositoryParams {
    pageId: string;
    languageCode: string;
    folderId: string;
}

export interface ITranslatePageRepository {
    execute(params: ITranslatePageRepositoryParams): Promise<TranslatedPageDto>;
}

export const TranslatePageRepository = createAbstraction<ITranslatePageRepository>(
    "WebsiteBuilder/TranslatePageRepository"
);

export namespace TranslatePageRepository {
    export type Interface = ITranslatePageRepository;
    export type Params = ITranslatePageRepositoryParams;
    export type Return = Promise<TranslatedPageDto>;
}

//
// Gateway
//
export interface ITranslatePageGatewayParams {
    pageId: string;
    languageCode: string;
    folderId: string;
}

export interface ITranslatePageGateway {
    execute(params: ITranslatePageGatewayParams): Promise<TranslatedPageDto>;
}

export const TranslatePageGateway = createAbstraction<ITranslatePageGateway>(
    "WebsiteBuilder/TranslatePageGateway"
);

export namespace TranslatePageGateway {
    export type Interface = ITranslatePageGateway;
    export type Params = ITranslatePageGatewayParams;
    export type Return = Promise<TranslatedPageDto>;
}
