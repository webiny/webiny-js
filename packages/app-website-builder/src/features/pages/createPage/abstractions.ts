import { createAbstraction } from "@webiny/feature/admin";
import type { Page } from "~/domain/Page/Page.js";
import type { WbLocation } from "~/types.js";
import type { PageDto } from "./PageDto.js";
import type { PageGqlDto } from "./PageGqlDto.js";

export interface CreatePageParams {
    location: WbLocation;
    properties?: Record<string, any>;
    metadata?: Record<string, any>;
    bindings?: Record<string, any>;
    elements?: Record<string, any>;
    extensions?: Record<string, any>;
}

export interface ICreatePageUseCase {
    execute(params: CreatePageParams): Promise<Page>;
}

export const CreatePageUseCase = createAbstraction<ICreatePageUseCase>(
    "WebsiteBuilder/CreatePageUseCase"
);
export namespace CreatePageUseCase {
    export type Interface = ICreatePageUseCase;
    export type Params = CreatePageParams;
}

export interface ICreatePageRepository {
    execute(page: Page): Promise<Page>;
}

export const CreatePageRepository = createAbstraction<ICreatePageRepository>(
    "WebsiteBuilder/CreatePageRepository"
);
export namespace CreatePageRepository {
    export type Interface = ICreatePageRepository;
}

export interface ICreatePageGateway {
    execute(pageDto: PageDto): Promise<PageGqlDto>;
}

export const CreatePageGateway = createAbstraction<ICreatePageGateway>(
    "WebsiteBuilder/CreatePageGateway"
);
export namespace CreatePageGateway {
    export type Interface = ICreatePageGateway;
}
