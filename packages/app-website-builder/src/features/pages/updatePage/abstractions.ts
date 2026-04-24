import { createAbstraction } from "@webiny/feature/admin";
import type { Page } from "~/domain/Page/Page.js";
import type { PageDto } from "./PageDto.js";
import type { PageGqlDto } from "./PageGqlDto.js";

export interface UpdatePageParams {
    id: string;
    properties?: Record<string, any>;
    metadata?: Record<string, any>;
    bindings?: Record<string, any>;
    elements?: Record<string, any>;
    extensions?: Record<string, any>;
}

export interface IUpdatePageUseCase {
    execute(params: UpdatePageParams): Promise<void>;
}

export const UpdatePageUseCase = createAbstraction<IUpdatePageUseCase>(
    "WebsiteBuilder/UpdatePageUseCase"
);
export namespace UpdatePageUseCase {
    export type Interface = IUpdatePageUseCase;
    export type Params = UpdatePageParams;
}

export interface IUpdatePageRepository {
    execute(page: Page): Promise<void>;
}

export const UpdatePageRepository = createAbstraction<IUpdatePageRepository>(
    "WebsiteBuilder/UpdatePageRepository"
);
export namespace UpdatePageRepository {
    export type Interface = IUpdatePageRepository;
}

export interface IUpdatePageGateway {
    execute(page: PageDto): Promise<PageGqlDto>;
}

export const UpdatePageGateway = createAbstraction<IUpdatePageGateway>(
    "WebsiteBuilder/UpdatePageGateway"
);
export namespace UpdatePageGateway {
    export type Interface = IUpdatePageGateway;
}
