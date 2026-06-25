import { createAbstraction } from "@webiny/feature/admin";
import type { CmsReferenceEntry } from "../refTypes.js";

// Gateway

export interface ISearchContentEntriesGatewayParams {
    modelIds: string[];
    query?: string;
    limit?: number;
}

export interface ISearchContentEntriesGatewayResult {
    data: CmsReferenceEntry[];
}

export interface ISearchContentEntriesGateway {
    execute(
        params: ISearchContentEntriesGatewayParams
    ): Promise<ISearchContentEntriesGatewayResult>;
}

export const SearchContentEntriesGateway = createAbstraction<ISearchContentEntriesGateway>(
    "SearchContentEntriesGateway"
);

export namespace SearchContentEntriesGateway {
    export type Interface = ISearchContentEntriesGateway;
}

// UseCase

export interface ISearchContentEntriesUseCaseParams {
    modelIds: string[];
    query?: string;
    limit?: number;
}

export interface ISearchContentEntriesUseCaseResult {
    data: CmsReferenceEntry[];
}

export interface ISearchContentEntriesUseCase {
    execute(
        params: ISearchContentEntriesUseCaseParams
    ): Promise<ISearchContentEntriesUseCaseResult>;
}

export const SearchContentEntriesUseCase = createAbstraction<ISearchContentEntriesUseCase>(
    "SearchContentEntriesUseCase"
);

export namespace SearchContentEntriesUseCase {
    export type Interface = ISearchContentEntriesUseCase;
}
