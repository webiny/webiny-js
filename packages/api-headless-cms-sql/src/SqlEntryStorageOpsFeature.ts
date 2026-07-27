import { createFeature } from "@webiny/feature/api/index.js";
import { SqlCreateEntry } from "~/operations/entry/SqlCreateEntry.js";
import { SqlCreateEntryRevisionFrom } from "~/operations/entry/SqlCreateEntryRevisionFrom.js";
import { SqlUpdateEntry } from "~/operations/entry/SqlUpdateEntry.js";
import { SqlDeleteEntry } from "~/operations/entry/SqlDeleteEntry.js";
import { SqlDeleteEntryRevision } from "~/operations/entry/SqlDeleteEntryRevision.js";
import { SqlDeleteMultipleEntries } from "~/operations/entry/SqlDeleteMultipleEntries.js";
import { SqlMoveToBin } from "~/operations/entry/SqlMoveToBin.js";
import { SqlRestoreFromBin } from "~/operations/entry/SqlRestoreFromBin.js";
import { SqlPublishEntry } from "~/operations/entry/SqlPublishEntry.js";
import { SqlUnpublishEntry } from "~/operations/entry/SqlUnpublishEntry.js";
import { SqlMoveEntry } from "~/operations/entry/SqlMoveEntry.js";
import { SqlGetEntry } from "~/operations/entry/SqlGetEntry.js";
import { SqlListEntries } from "~/operations/entry/SqlListEntries.js";
import { SqlGetEntriesByIds } from "~/operations/entry/SqlGetEntriesByIds.js";
import { SqlGetLatestEntriesByIds } from "~/operations/entry/SqlGetLatestEntriesByIds.js";
import { SqlGetPublishedEntriesByIds } from "~/operations/entry/SqlGetPublishedEntriesByIds.js";
import { SqlGetRevisions } from "~/operations/entry/SqlGetRevisions.js";
import { SqlGetRevisionById } from "~/operations/entry/SqlGetRevisionById.js";
import { SqlGetLatestRevisionByEntryId } from "~/operations/entry/SqlGetLatestRevisionByEntryId.js";
import { SqlGetPublishedRevisionByEntryId } from "~/operations/entry/SqlGetPublishedRevisionByEntryId.js";
import { SqlGetPreviousRevision } from "~/operations/entry/SqlGetPreviousRevision.js";
import { SqlGetUniqueFieldValues } from "~/operations/entry/SqlGetUniqueFieldValues.js";

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
