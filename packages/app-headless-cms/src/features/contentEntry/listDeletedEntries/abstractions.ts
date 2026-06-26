import { createAbstraction } from "@webiny/feature/admin";
import type { CmsContentEntry, CmsMetaResponse, CmsModel } from "~/types.js";

export interface IListDeletedEntriesParams {
    model: CmsModel;
    where?: Record<string, unknown>;
    sort?: string[];
    limit?: number;
    after?: string;
    search?: string;
}

export interface IListDeletedEntriesResult {
    data: CmsContentEntry[];
    meta: CmsMetaResponse;
}

export interface IListDeletedEntriesGateway {
    execute(params: IListDeletedEntriesParams): Promise<IListDeletedEntriesResult>;
}

export const ListDeletedEntriesGateway = createAbstraction<IListDeletedEntriesGateway>(
    "ListDeletedEntriesGateway"
);

export namespace ListDeletedEntriesGateway {
    export type Interface = IListDeletedEntriesGateway;
}

export interface IListDeletedEntriesRepository {
    execute(params: IListDeletedEntriesParams): Promise<IListDeletedEntriesResult>;
}

export const ListDeletedEntriesRepository = createAbstraction<IListDeletedEntriesRepository>(
    "ListDeletedEntriesRepository"
);

export namespace ListDeletedEntriesRepository {
    export type Interface = IListDeletedEntriesRepository;
}

export interface IListDeletedEntriesUseCase {
    execute(params: IListDeletedEntriesParams): Promise<IListDeletedEntriesResult>;
}

export const ListDeletedEntriesUseCase = createAbstraction<IListDeletedEntriesUseCase>(
    "ListDeletedEntriesUseCase"
);

export namespace ListDeletedEntriesUseCase {
    export type Interface = IListDeletedEntriesUseCase;
}
