import DataLoader from "dataloader";
import {
    CmsContentEntry,
    CmsContentEntryStorageOperations,
    CmsContentModel,
    CmsContext
} from "../../../../../types";

export const getAllEntryRevisions = (
    context: CmsContext,
    model: CmsContentModel,
    storageOperations: CmsContentEntryStorageOperations
) => {
    return new DataLoader<string, CmsContentEntry>(async ids => {
        return await storageOperations.getAllRevisionsByIds(model, ids);
    });
};

export const getRevisionById = (
    context: CmsContext,
    model: CmsContentModel,
    storageOperations: CmsContentEntryStorageOperations
) => {
    return new DataLoader<string, CmsContentEntry>(async ids => {
        return await storageOperations.getByIds(model, ids);
    });
};

export const getPublishedRevisionByEntryId = (
    context: CmsContext,
    model: CmsContentModel,
    storageOperations: CmsContentEntryStorageOperations
) => {
    return new DataLoader<string, CmsContentEntry>(async ids => {
        return await storageOperations.getPublishedByIds(model, ids);
    });
};

export const getLatestRevisionByEntryId = (
    context: CmsContext,
    model: CmsContentModel,
    storageOperations: CmsContentEntryStorageOperations
) => {
    return new DataLoader<string, CmsContentEntry>(async ids => {
        return await storageOperations.getLatestByIds(model, ids);
    });
};
