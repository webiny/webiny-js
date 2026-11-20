import { createAbstraction } from "@webiny/feature/admin";
import type { GlobalComponentRecord } from "@webiny/website-builder-sdk";

export interface ListGlobalComponentsParams {
    // A language code, or "default" for documents without a language.
    language: string;
    // Also list the "default" records of globals that have none in `language`.
    fallback?: boolean;
}

// UseCase
export interface IListGlobalComponentsUseCase {
    execute(params: ListGlobalComponentsParams): Promise<GlobalComponentRecord[]>;
}

export const ListGlobalComponentsUseCase = createAbstraction<IListGlobalComponentsUseCase>(
    "WebsiteBuilder/ListGlobalComponentsUseCase"
);
export namespace ListGlobalComponentsUseCase {
    export type Interface = IListGlobalComponentsUseCase;
    export type Params = ListGlobalComponentsParams;
}

// Gateway
export interface IListGlobalComponentsGateway {
    execute(params: ListGlobalComponentsParams): Promise<GlobalComponentRecord[]>;
}

export const ListGlobalComponentsGateway = createAbstraction<IListGlobalComponentsGateway>(
    "WebsiteBuilder/ListGlobalComponentsGateway"
);
export namespace ListGlobalComponentsGateway {
    export type Interface = IListGlobalComponentsGateway;
    export type Params = ListGlobalComponentsParams;
}
