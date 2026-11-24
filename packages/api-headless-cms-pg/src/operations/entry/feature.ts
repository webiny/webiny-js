import { createFeature } from "@webiny/feature/api/index.js";
import { PgCreateEntry } from "./PgCreateEntry.js";
import { PgCreateEntryRevisionFrom } from "./PgCreateEntryRevisionFrom.js";
import { PgUpdateEntry } from "./PgUpdateEntry.js";
import { PgPublishEntry } from "./PgPublishEntry.js";
import { PgUnpublishEntry } from "./PgUnpublishEntry.js";
import { PgDeleteEntry } from "./PgDeleteEntry.js";
import { PgDeleteMultipleEntries } from "./PgDeleteMultipleEntries.js";
import { PgDeleteEntryRevision } from "./PgDeleteEntryRevision.js";
import { PgMoveToBin } from "./PgMoveToBin.js";
import { PgRestoreFromBin } from "./PgRestoreFromBin.js";
import { PgMoveEntry } from "./PgMoveEntry.js";
import { PgGetEntriesByIds } from "./PgGetEntriesByIds.js";
import { PgGetLatestEntriesByIds } from "./PgGetLatestEntriesByIds.js";
import { PgGetPublishedEntriesByIds } from "./PgGetPublishedEntriesByIds.js";
import { PgGetRevisionById } from "./PgGetRevisionById.js";
import { PgGetLatestRevisionByEntryId } from "./PgGetLatestRevisionByEntryId.js";
import { PgGetPublishedRevisionByEntryId } from "./PgGetPublishedRevisionByEntryId.js";
import { PgGetPreviousRevision } from "./PgGetPreviousRevision.js";
import { PgGetRevisions } from "./PgGetRevisions.js";
import { PgListEntries } from "./PgListEntries.js";
import { PgGetEntry } from "./PgGetEntry.js";
import { PgGetUniqueFieldValues } from "./PgGetUniqueFieldValues.js";

export const PgEntryStorageOpsFeature = createFeature({
    name: "cms.pg.entryStorageOps",
    register: container => {
        container.register(PgCreateEntry);
        container.register(PgCreateEntryRevisionFrom);
        container.register(PgUpdateEntry);
        container.register(PgPublishEntry);
        container.register(PgUnpublishEntry);
        container.register(PgDeleteEntry);
        container.register(PgDeleteMultipleEntries);
        container.register(PgDeleteEntryRevision);
        container.register(PgMoveToBin);
        container.register(PgRestoreFromBin);
        container.register(PgMoveEntry);
        container.register(PgGetEntriesByIds);
        container.register(PgGetLatestEntriesByIds);
        container.register(PgGetPublishedEntriesByIds);
        container.register(PgGetRevisionById);
        container.register(PgGetLatestRevisionByEntryId);
        container.register(PgGetPublishedRevisionByEntryId);
        container.register(PgGetPreviousRevision);
        container.register(PgGetRevisions);
        container.register(PgListEntries);
        container.register(PgGetEntry);
        container.register(PgGetUniqueFieldValues);
    }
});
