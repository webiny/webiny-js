import { createFeature } from "@webiny/feature/api/index.js";
import { DataLoadersHandler } from "~/operations/entry/dataLoaders.js";
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

export const DdbEntryStorageOpsFeature = createFeature({
    name: "cms.ddb.entryStorageOps",
    register: container => {
        container.register(DataLoadersHandler).inSingletonScope();
        container.register(DdbCreateEntry);
        container.register(DdbCreateEntryRevisionFrom);
        container.register(DdbUpdateEntry);
        container.register(DdbMoveEntry);
        container.register(DdbMoveToBin);
        container.register(DdbDeleteEntry);
        container.register(DdbRestoreFromBin);
        container.register(DdbDeleteEntryRevision);
        container.register(DdbDeleteMultipleEntries);
        container.register(DdbGetEntry);
        container.register(DdbListEntries);
        container.register(DdbPublishEntry);
        container.register(DdbUnpublishEntry);
        container.register(DdbGetEntriesByIds);
        container.register(DdbGetLatestEntriesByIds);
        container.register(DdbGetPublishedEntriesByIds);
        container.register(DdbGetRevisions);
        container.register(DdbGetRevisionById);
        container.register(DdbGetLatestRevisionByEntryId);
        container.register(DdbGetPublishedRevisionByEntryId);
        container.register(DdbGetPreviousRevision);
        container.register(DdbGetUniqueFieldValues);
    }
});
