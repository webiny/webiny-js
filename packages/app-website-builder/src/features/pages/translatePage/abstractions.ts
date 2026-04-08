import { createAbstraction } from "webiny/admin";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";
import type { Page } from "~/domain/Page/index.js";

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
    execute(params: TranslatePageParams): Promise<Page>;
}

export const TranslatePageUseCase = createAbstraction<ITranslatePageUseCase>("WebsiteBuilder/TranslatePageUseCase");

export namespace TranslatePageUseCase {
    export type Interface = ITranslatePageUseCase;
    export type Params = TranslatePageParams;
}

//
// Repository
//
export interface TranslatePageRepositoryParams {
    pageId: string;
    languageCode: string;
    folderId: string;
}

export interface ITranslatePageRepository {
    execute(params: TranslatePageRepositoryParams): Promise<Page>;
}

export const TranslatePageRepository = createAbstraction<ITranslatePageRepository>("WebsiteBuilder/TranslatePageRepository");

export namespace TranslatePageRepository {
    export type Interface = ITranslatePageRepository;
}

//
// Gateway
//
export interface TranslatePageGatewayParams {
    pageId: string;
    languageCode: string;
    folderId: string;
}

export interface ITranslatePageGateway {
    execute(params: TranslatePageGatewayParams): Promise<PageGatewayDto>;
}

export const TranslatePageGateway = createAbstraction<ITranslatePageGateway>("WebsiteBuilder/TranslatePageGateway");

export namespace TranslatePageGateway {
    export type Interface = ITranslatePageGateway;
}
