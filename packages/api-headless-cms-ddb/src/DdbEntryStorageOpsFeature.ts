import { createFeature } from "@webiny/feature/api/index.js";
import type { Implementation, Constructor } from "@webiny/di";
import { DataLoadersHandler } from "~/operations/entry/dataLoaders.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";
import { CmsDdbEntryEntity } from "~/abstractions/CmsDdbEntryEntity.js";
import { DdbCreateEntry } from "~/operations/entry/DdbCreateEntry.js";
import { DdbCreateEntryRevisionFrom } from "~/operations/entry/DdbCreateEntryRevisionFrom.js";
import { DdbUpdateEntry } from "~/operations/entry/DdbUpdateEntry.js";
import { DdbMoveEntry } from "~/operations/entry/DdbMoveEntry.js";
import { DdbMoveToBin } from "~/operations/entry/DdbMoveToBin.js";
import { DdbDeleteEntry } from "~/operations/entry/DdbDeleteEntry.js";
import { DdbRestoreFromBin } from "~/operations/entry/DdbRestoreFromBin.js";
import { DdbDeleteEntryRevision } from "~/operations/entry/DdbDeleteEntryRevision.js";
import { DdbDeleteMultipleEntries } from "~/operations/entry/DdbDeleteMultipleEntries.js";
import { DdbGetEntry } from "~/operations/entry/DdbGetEntry.js";
import { DdbListEntries } from "~/operations/entry/DdbListEntries.js";
import { DdbPublishEntry } from "~/operations/entry/DdbPublishEntry.js";
import { DdbUnpublishEntry } from "~/operations/entry/DdbUnpublishEntry.js";
import { DdbGetEntriesByIds } from "~/operations/entry/DdbGetEntriesByIds.js";
import { DdbGetLatestEntriesByIds } from "~/operations/entry/DdbGetLatestEntriesByIds.js";
import { DdbGetPublishedEntriesByIds } from "~/operations/entry/DdbGetPublishedEntriesByIds.js";
import { DdbGetRevisions } from "~/operations/entry/DdbGetRevisions.js";
import { DdbGetRevisionById } from "~/operations/entry/DdbGetRevisionById.js";
import { DdbGetLatestRevisionByEntryId } from "~/operations/entry/DdbGetLatestRevisionByEntryId.js";
import { DdbGetPublishedRevisionByEntryId } from "~/operations/entry/DdbGetPublishedRevisionByEntryId.js";
import { DdbGetPreviousRevision } from "~/operations/entry/DdbGetPreviousRevision.js";
import { DdbGetUniqueFieldValues } from "~/operations/entry/DdbGetUniqueFieldValues.js";

interface DdbEntryOpsMap {
    create: Implementation<Constructor>;
    createRevisionFrom: Implementation<Constructor>;
    update: Implementation<Constructor>;
    move: Implementation<Constructor>;
    moveToBin: Implementation<Constructor>;
    delete: Implementation<Constructor>;
    restoreFromBin: Implementation<Constructor>;
    deleteRevision: Implementation<Constructor>;
    deleteMultipleEntries: Implementation<Constructor>;
    get: Implementation<Constructor>;
    list: Implementation<Constructor>;
    publish: Implementation<Constructor>;
    unpublish: Implementation<Constructor>;
    getByIds: Implementation<Constructor>;
    getLatestByIds: Implementation<Constructor>;
    getPublishedByIds: Implementation<Constructor>;
    getRevisions: Implementation<Constructor>;
    getRevisionById: Implementation<Constructor>;
    getLatestRevisionByEntryId: Implementation<Constructor>;
    getPublishedRevisionByEntryId: Implementation<Constructor>;
    getPreviousRevision: Implementation<Constructor>;
    getUniqueFieldValues: Implementation<Constructor>;
}

const OPS: DdbEntryOpsMap = {
    create: DdbCreateEntry,
    createRevisionFrom: DdbCreateEntryRevisionFrom,
    update: DdbUpdateEntry,
    move: DdbMoveEntry,
    moveToBin: DdbMoveToBin,
    delete: DdbDeleteEntry,
    restoreFromBin: DdbRestoreFromBin,
    deleteRevision: DdbDeleteEntryRevision,
    deleteMultipleEntries: DdbDeleteMultipleEntries,
    get: DdbGetEntry,
    list: DdbListEntries,
    publish: DdbPublishEntry,
    unpublish: DdbUnpublishEntry,
    getByIds: DdbGetEntriesByIds,
    getLatestByIds: DdbGetLatestEntriesByIds,
    getPublishedByIds: DdbGetPublishedEntriesByIds,
    getRevisions: DdbGetRevisions,
    getRevisionById: DdbGetRevisionById,
    getLatestRevisionByEntryId: DdbGetLatestRevisionByEntryId,
    getPublishedRevisionByEntryId: DdbGetPublishedRevisionByEntryId,
    getPreviousRevision: DdbGetPreviousRevision,
    getUniqueFieldValues: DdbGetUniqueFieldValues
};

export const DdbEntryStorageOpsFeature = createFeature({
    name: "cms.ddb.entryStorageOps",
    register: container => {
        container.registerFactory(CmsDdbDataLoaders, () => {
            const entity = container.resolve(CmsDdbEntryEntity);
            return new DataLoadersHandler({ entity });
        });

        for (const impl of Object.values(OPS)) {
            container.register(impl);
        }
    }
});
