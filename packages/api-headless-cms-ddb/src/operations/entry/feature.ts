import { createFeature } from "@webiny/feature/api/index.js";
import { DataLoadersHandler } from "./dataLoaders.js";
import { DdbCreateEntry } from "./DdbCreateEntry.js";
import { DdbCreateEntryRevisionFrom } from "./DdbCreateEntryRevisionFrom.js";
import { DdbUpdateEntry } from "./DdbUpdateEntry.js";
import { DdbMoveEntry } from "./DdbMoveEntry.js";
import { DdbMoveToBin } from "./DdbMoveToBin.js";
import { DdbDeleteEntry } from "./DdbDeleteEntry.js";
import { DdbRestoreFromBin } from "./DdbRestoreFromBin.js";
import { DdbDeleteEntryRevision } from "./DdbDeleteEntryRevision.js";
import { DdbDeleteMultipleEntries } from "./DdbDeleteMultipleEntries.js";
import { DdbGetEntry } from "./DdbGetEntry.js";
import { DdbListEntries } from "./DdbListEntries.js";
import { DdbPublishEntry } from "./DdbPublishEntry.js";
import { DdbUnpublishEntry } from "./DdbUnpublishEntry.js";
import { DdbGetEntriesByIds } from "./DdbGetEntriesByIds.js";
import { DdbGetLatestEntriesByIds } from "./DdbGetLatestEntriesByIds.js";
import { DdbGetPublishedEntriesByIds } from "./DdbGetPublishedEntriesByIds.js";
import { DdbGetRevisions } from "./DdbGetRevisions.js";
import { DdbGetRevisionById } from "./DdbGetRevisionById.js";
import { DdbGetLatestRevisionByEntryId } from "./DdbGetLatestRevisionByEntryId.js";
import { DdbGetPublishedRevisionByEntryId } from "./DdbGetPublishedRevisionByEntryId.js";
import { DdbGetPreviousRevision } from "./DdbGetPreviousRevision.js";
import { DdbGetUniqueFieldValues } from "./DdbGetUniqueFieldValues.js";

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
