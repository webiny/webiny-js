import { createFeature } from "@webiny/feature/api/index.js";
import { SqlCreateEntry } from "./SqlCreateEntry.js";
import { SqlCreateEntryRevisionFrom } from "./SqlCreateEntryRevisionFrom.js";
import { SqlUpdateEntry } from "./SqlUpdateEntry.js";
import { SqlDeleteEntry } from "./SqlDeleteEntry.js";
import { SqlDeleteEntryRevision } from "./SqlDeleteEntryRevision.js";
import { SqlDeleteMultipleEntries } from "./SqlDeleteMultipleEntries.js";
import { SqlMoveToBin } from "./SqlMoveToBin.js";
import { SqlRestoreFromBin } from "./SqlRestoreFromBin.js";
import { SqlPublishEntry } from "./SqlPublishEntry.js";
import { SqlUnpublishEntry } from "./SqlUnpublishEntry.js";
import { SqlMoveEntry } from "./SqlMoveEntry.js";
import { SqlGetEntry } from "./SqlGetEntry.js";
import { SqlListEntries } from "./SqlListEntries.js";
import { SqlGetEntriesByIds } from "./SqlGetEntriesByIds.js";
import { SqlGetLatestEntriesByIds } from "./SqlGetLatestEntriesByIds.js";
import { SqlGetPublishedEntriesByIds } from "./SqlGetPublishedEntriesByIds.js";
import { SqlGetRevisions } from "./SqlGetRevisions.js";
import { SqlGetRevisionById } from "./SqlGetRevisionById.js";
import { SqlGetLatestRevisionByEntryId } from "./SqlGetLatestRevisionByEntryId.js";
import { SqlGetPublishedRevisionByEntryId } from "./SqlGetPublishedRevisionByEntryId.js";
import { SqlGetPreviousRevision } from "./SqlGetPreviousRevision.js";
import { SqlGetUniqueFieldValues } from "./SqlGetUniqueFieldValues.js";

export const SqlEntryStorageOpsFeature = createFeature({
    name: "cms.sql.entryStorageOps",
    register: container => {
        container.register(SqlCreateEntry);
        container.register(SqlCreateEntryRevisionFrom);
        container.register(SqlUpdateEntry);
        container.register(SqlDeleteEntry);
        container.register(SqlDeleteEntryRevision);
        container.register(SqlDeleteMultipleEntries);
        container.register(SqlMoveToBin);
        container.register(SqlRestoreFromBin);
        container.register(SqlPublishEntry);
        container.register(SqlUnpublishEntry);
        container.register(SqlMoveEntry);
        container.register(SqlGetEntry);
        container.register(SqlListEntries);
        container.register(SqlGetEntriesByIds);
        container.register(SqlGetLatestEntriesByIds);
        container.register(SqlGetPublishedEntriesByIds);
        container.register(SqlGetRevisions);
        container.register(SqlGetRevisionById);
        container.register(SqlGetLatestRevisionByEntryId);
        container.register(SqlGetPublishedRevisionByEntryId);
        container.register(SqlGetPreviousRevision);
        container.register(SqlGetUniqueFieldValues);
    }
});
