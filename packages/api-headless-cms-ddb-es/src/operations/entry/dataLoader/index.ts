import DataLoader from "dataloader";
import { DataLoaderParams } from "./types";
import { createGetAllEntryRevisions } from "./getAllEntryRevisions";
import { createGetLatestRevisionByEntryId } from "./getLatestRevisionByEntryId";
import { createGetPublishedRevisionByEntryId } from "./getPublishedRevisionByEntryId";
import { createGetRevisionById } from "./getRevisionById";

export * from "./DataLoaderCache";

interface Callable {
    (params: DataLoaderParams): DataLoader<any, any>;
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
