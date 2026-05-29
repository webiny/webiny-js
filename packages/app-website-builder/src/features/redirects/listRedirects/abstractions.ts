import { createAbstraction } from "@webiny/feature/admin";
import type { Redirect } from "~/domain/Redirect/Redirect.js";

export interface ListRedirectsGatewayParams {
    search?: string;
    where?: Record<string, unknown>;
    sort?: string[];
    limit?: number;
    after?: string;
}

export interface ListRedirectsMeta {
    cursor: string | null;
    totalCount: number;
    hasMoreItems: boolean;
}

export interface ListRedirectsGatewayResult {
    data: Redirect[];
    meta: ListRedirectsMeta;
}

export interface IListRedirectsGateway {
    execute(params: ListRedirectsGatewayParams): Promise<ListRedirectsGatewayResult>;
}

export const ListRedirectsGateway = createAbstraction<IListRedirectsGateway>(
    "WebsiteBuilder/ListRedirectsGateway"
);

export namespace ListRedirectsGateway {
    export type Interface = IListRedirectsGateway;
}

export interface IListRedirectsRepository {
    execute(params: ListRedirectsGatewayParams): Promise<ListRedirectsGatewayResult>;
}

export const ListRedirectsRepository = createAbstraction<IListRedirectsRepository>(
    "WebsiteBuilder/ListRedirectsRepository"
);

export namespace ListRedirectsRepository {
    export type Interface = IListRedirectsRepository;
}

export interface IListRedirectsUseCase {
    execute(params: ListRedirectsGatewayParams): Promise<ListRedirectsGatewayResult>;
}

export const ListRedirectsUseCase = createAbstraction<IListRedirectsUseCase>(
    "WebsiteBuilder/ListRedirectsUseCase"
);

export namespace ListRedirectsUseCase {
    export type Interface = IListRedirectsUseCase;
}
