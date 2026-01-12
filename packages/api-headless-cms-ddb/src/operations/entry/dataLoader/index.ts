import type DataLoader from "dataloader";
import type { IDataLoaderParams } from "./types.js";
import { createGetAllEntryRevisions } from "./getAllEntryRevisions.js";
import { createGetLatestRevisionByEntryId } from "./getLatestRevisionByEntryId.js";
import { createGetPublishedRevisionByEntryId } from "./getPublishedRevisionByEntryId.js";
import { createGetRevisionById } from "./getRevisionById.js";

export * from "./DataLoaderCache.js";

interface Callable {
    (params: IDataLoaderParams): DataLoader<any, any>;
}

const dataLoaders: Record<string, Callable> = {
    getAllEntryRevisions: createGetAllEntryRevisions,
    getLatestRevisionByEntryId: createGetLatestRevisionByEntryId,
    getPublishedRevisionByEntryId: createGetPublishedRevisionByEntryId,
    getRevisionById: createGetRevisionById
};

export type DataLoaders =
    | "getAllEntryRevisions"
    | "getRevisionById"
    | "getPublishedRevisionByEntryId"
    | "getLatestRevisionByEntryId";

export const getDataLoaderFactory = (name: string) => {
    if (!dataLoaders[name]) {
        throw new Error(`Missing data loader "${name}".`);
    }
    return dataLoaders[name];
};
