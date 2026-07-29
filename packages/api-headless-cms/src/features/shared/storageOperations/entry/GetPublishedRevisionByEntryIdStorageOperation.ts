import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsModel,
    CmsEntry,
    CmsEntryValues,
    CmsEntryStorageOperationsGetPublishedRevisionParams
} from "~/types/index.js";

export interface IGetPublishedRevisionByEntryIdStorageOperation {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedRevisionParams
    ): Promise<CmsEntry<T> | null>;
}

export const GetPublishedRevisionByEntryIdStorageOperation =
    createAbstraction<IGetPublishedRevisionByEntryIdStorageOperation>(
        "Cms/Entry/GetPublishedRevisionByEntryIdStorageOperation"
    );

export namespace GetPublishedRevisionByEntryIdStorageOperation {
    export type Interface = IGetPublishedRevisionByEntryIdStorageOperation;
}
