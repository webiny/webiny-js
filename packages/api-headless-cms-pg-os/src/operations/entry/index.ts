import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { Container } from "@webiny/feature/api";
import { SqlEntryOperations } from "@webiny/api-headless-cms-sql/operations/entry/abstractions/SqlEntryOperations.js";
import { EntryWriteOperations } from "./abstractions/EntryWriteOperations.js";
import { EntrySearchOperations } from "./abstractions/EntrySearchOperations.js";

export const createEntriesStorageOperations = (container: Container): CmsEntryStorageOperations => {
    const sqlOps = container.resolve(SqlEntryOperations);
    const writeOps = container.resolve(EntryWriteOperations);
    const searchOps = container.resolve(EntrySearchOperations);

    return {
        ...writeOps,
        ...searchOps,
        getRevisions: sqlOps.getRevisions,
        getRevisionById: sqlOps.getRevisionById,
        getByIds: sqlOps.getByIds,
        getLatestByIds: sqlOps.getLatestByIds,
        getPublishedByIds: sqlOps.getPublishedByIds,
        getLatestRevisionByEntryId: sqlOps.getLatestRevisionByEntryId,
        getPublishedRevisionByEntryId: sqlOps.getPublishedRevisionByEntryId,
        getPreviousRevision: sqlOps.getPreviousRevision
    };
};
