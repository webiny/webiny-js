import { createFeature } from "@webiny/feature/api/index.js";
import { DataLoadersHandler } from "./dataLoaders.js";
import { DdbEsCreateEntry } from "./DdbEsCreateEntry.js";
import { DdbEsCreateEntryRevisionFrom } from "./DdbEsCreateEntryRevisionFrom.js";
import { DdbEsUpdateEntry } from "./DdbEsUpdateEntry.js";
import { DdbEsMoveEntry } from "./DdbEsMoveEntry.js";
import { DdbEsMoveToBin } from "./DdbEsMoveToBin.js";
import { DdbEsDeleteEntry } from "./DdbEsDeleteEntry.js";
import { DdbEsRestoreFromBin } from "./DdbEsRestoreFromBin.js";
import { DdbEsDeleteEntryRevision } from "./DdbEsDeleteEntryRevision.js";
import { DdbEsDeleteMultipleEntries } from "./DdbEsDeleteMultipleEntries.js";
import { DdbEsGetEntry } from "./DdbEsGetEntry.js";
import { DdbEsListEntries } from "./DdbEsListEntries.js";
import { DdbEsPublishEntry } from "./DdbEsPublishEntry.js";
import { DdbEsUnpublishEntry } from "./DdbEsUnpublishEntry.js";
import { DdbEsGetEntriesByIds } from "./DdbEsGetEntriesByIds.js";
import { DdbEsGetLatestEntriesByIds } from "./DdbEsGetLatestEntriesByIds.js";
import { DdbEsGetPublishedEntriesByIds } from "./DdbEsGetPublishedEntriesByIds.js";
import { DdbEsGetRevisions } from "./DdbEsGetRevisions.js";
import { DdbEsGetRevisionById } from "./DdbEsGetRevisionById.js";
import { DdbEsGetLatestRevisionByEntryId } from "./DdbEsGetLatestRevisionByEntryId.js";
import { DdbEsGetPublishedRevisionByEntryId } from "./DdbEsGetPublishedRevisionByEntryId.js";
import { DdbEsGetPreviousRevision } from "./DdbEsGetPreviousRevision.js";
import { DdbEsGetUniqueFieldValues } from "./DdbEsGetUniqueFieldValues.js";

export const DdbEsEntryStorageOpsFeature = createFeature({
    name: "cms.ddbEs.entryStorageOps",
    register: container => {
        // The DataLoader caches reads, so it must live for one request: container scoped, it is built
        // per request (child) container even though the feature is registered once in the root.
        container.register(DataLoadersHandler).inContainerScope();
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
