import { createFeature } from "@webiny/feature/api/index.js";
import { DataLoadersHandler } from "~/operations/entry/dataLoaders.js";
import { DdbEsCreateEntry } from "~/operations/entry/DdbEsCreateEntry.js";
import { DdbEsCreateEntryRevisionFrom } from "~/operations/entry/DdbEsCreateEntryRevisionFrom.js";
import { DdbEsUpdateEntry } from "~/operations/entry/DdbEsUpdateEntry.js";
import { DdbEsMoveEntry } from "~/operations/entry/DdbEsMoveEntry.js";
import { DdbEsMoveToBin } from "~/operations/entry/DdbEsMoveToBin.js";
import { DdbEsDeleteEntry } from "~/operations/entry/DdbEsDeleteEntry.js";
import { DdbEsRestoreFromBin } from "~/operations/entry/DdbEsRestoreFromBin.js";
import { DdbEsDeleteEntryRevision } from "~/operations/entry/DdbEsDeleteEntryRevision.js";
import { DdbEsDeleteMultipleEntries } from "~/operations/entry/DdbEsDeleteMultipleEntries.js";
import { DdbEsGetEntry } from "~/operations/entry/DdbEsGetEntry.js";
import { DdbEsListEntries } from "~/operations/entry/DdbEsListEntries.js";
import { DdbEsPublishEntry } from "~/operations/entry/DdbEsPublishEntry.js";
import { DdbEsUnpublishEntry } from "~/operations/entry/DdbEsUnpublishEntry.js";
import { DdbEsGetEntriesByIds } from "~/operations/entry/DdbEsGetEntriesByIds.js";
import { DdbEsGetLatestEntriesByIds } from "~/operations/entry/DdbEsGetLatestEntriesByIds.js";
import { DdbEsGetPublishedEntriesByIds } from "~/operations/entry/DdbEsGetPublishedEntriesByIds.js";
import { DdbEsGetRevisions } from "~/operations/entry/DdbEsGetRevisions.js";
import { DdbEsGetRevisionById } from "~/operations/entry/DdbEsGetRevisionById.js";
import { DdbEsGetLatestRevisionByEntryId } from "~/operations/entry/DdbEsGetLatestRevisionByEntryId.js";
import { DdbEsGetPublishedRevisionByEntryId } from "~/operations/entry/DdbEsGetPublishedRevisionByEntryId.js";
import { DdbEsGetPreviousRevision } from "~/operations/entry/DdbEsGetPreviousRevision.js";
import { DdbEsGetUniqueFieldValues } from "~/operations/entry/DdbEsGetUniqueFieldValues.js";

export const DdbEsEntryStorageOpsFeature = createFeature({
    name: "cms.ddbEs.entryStorageOps",
    register: container => {
        container.register(DataLoadersHandler).inSingletonScope();
        container.register(DdbEsCreateEntry);
        container.register(DdbEsCreateEntryRevisionFrom);
        container.register(DdbEsUpdateEntry);
        container.register(DdbEsMoveEntry);
        container.register(DdbEsMoveToBin);
        container.register(DdbEsDeleteEntry);
        container.register(DdbEsRestoreFromBin);
        container.register(DdbEsDeleteEntryRevision);
        container.register(DdbEsDeleteMultipleEntries);
        container.register(DdbEsGetEntry);
        container.register(DdbEsListEntries);
        container.register(DdbEsPublishEntry);
        container.register(DdbEsUnpublishEntry);
        container.register(DdbEsGetEntriesByIds);
        container.register(DdbEsGetLatestEntriesByIds);
        container.register(DdbEsGetPublishedEntriesByIds);
        container.register(DdbEsGetRevisions);
        container.register(DdbEsGetRevisionById);
        container.register(DdbEsGetLatestRevisionByEntryId);
        container.register(DdbEsGetPublishedRevisionByEntryId);
        container.register(DdbEsGetPreviousRevision);
        container.register(DdbEsGetUniqueFieldValues);
    }
});
