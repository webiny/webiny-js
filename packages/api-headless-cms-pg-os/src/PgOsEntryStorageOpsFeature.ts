import { createFeature } from "@webiny/feature/api/index.js";
import { EntrySearchOperations } from "~/operations/entry/EntrySearchOperations.js";

import { PgOsCreateEntry } from "~/operations/entry/PgOsCreateEntry.js";
import { PgOsCreateEntryRevisionFrom } from "~/operations/entry/PgOsCreateEntryRevisionFrom.js";
import { PgOsUpdateEntry } from "~/operations/entry/PgOsUpdateEntry.js";
import { PgOsPublishEntry } from "~/operations/entry/PgOsPublishEntry.js";
import { PgOsUnpublishEntry } from "~/operations/entry/PgOsUnpublishEntry.js";
import { PgOsMoveEntry } from "~/operations/entry/PgOsMoveEntry.js";
import { PgOsMoveToBin } from "~/operations/entry/PgOsMoveToBin.js";
import { PgOsRestoreFromBin } from "~/operations/entry/PgOsRestoreFromBin.js";
import { PgOsDeleteEntry } from "~/operations/entry/PgOsDeleteEntry.js";
import { PgOsDeleteEntryRevision } from "~/operations/entry/PgOsDeleteEntryRevision.js";
import { PgOsDeleteMultipleEntries } from "~/operations/entry/PgOsDeleteMultipleEntries.js";

import { PgOsGetEntry } from "~/operations/entry/PgOsGetEntry.js";
import { PgOsListEntries } from "~/operations/entry/PgOsListEntries.js";
import { PgOsGetUniqueFieldValues } from "~/operations/entry/PgOsGetUniqueFieldValues.js";

import { SqlGetRevisions } from "@webiny/api-headless-cms-sql/operations/entry/SqlGetRevisions.js";
import { SqlGetRevisionById } from "@webiny/api-headless-cms-sql/operations/entry/SqlGetRevisionById.js";
import { SqlGetEntriesByIds } from "@webiny/api-headless-cms-sql/operations/entry/SqlGetEntriesByIds.js";
import { SqlGetLatestEntriesByIds } from "@webiny/api-headless-cms-sql/operations/entry/SqlGetLatestEntriesByIds.js";
import { SqlGetPublishedEntriesByIds } from "@webiny/api-headless-cms-sql/operations/entry/SqlGetPublishedEntriesByIds.js";
import { SqlGetLatestRevisionByEntryId } from "@webiny/api-headless-cms-sql/operations/entry/SqlGetLatestRevisionByEntryId.js";
import { SqlGetPublishedRevisionByEntryId } from "@webiny/api-headless-cms-sql/operations/entry/SqlGetPublishedRevisionByEntryId.js";
import { SqlGetPreviousRevision } from "@webiny/api-headless-cms-sql/operations/entry/SqlGetPreviousRevision.js";
a;
export const PgOsEntryStorageOpsFeature = createFeature({
    name: "cms.pgOs.entryStorageOps",
    register: container => {
        // Write ops (11) — decorators wrapping SQL per-method implementations with OpenSearch sync
        container.registerDecorator(PgOsCreateEntry);
        container.registerDecorator(PgOsCreateEntryRevisionFrom);
        container.registerDecorator(PgOsUpdateEntry);
        container.registerDecorator(PgOsPublishEntry);
        container.registerDecorator(PgOsUnpublishEntry);
        container.registerDecorator(PgOsMoveEntry);
        container.registerDecorator(PgOsMoveToBin);
        container.registerDecorator(PgOsRestoreFromBin);
        container.registerDecorator(PgOsDeleteEntry);
        container.registerDecorator(PgOsDeleteEntryRevision);
        container.registerDecorator(PgOsDeleteMultipleEntries);

        // EntrySearchOperations — OpenSearch-based search implementation
        container.register(EntrySearchOperations);

        // Search ops (3) — PG-OS specific (OpenSearch)
        container.register(PgOsGetEntry);
        container.register(PgOsListEntries);
        container.register(PgOsGetUniqueFieldValues);

        // SQL ops (8) — reuse SQL's per-method DI classes directly
        container.register(SqlGetRevisions);
        container.register(SqlGetRevisionById);
        container.register(SqlGetEntriesByIds);
        container.register(SqlGetLatestEntriesByIds);
        container.register(SqlGetPublishedEntriesByIds);
        container.register(SqlGetLatestRevisionByEntryId);
        container.register(SqlGetPublishedRevisionByEntryId);
        container.register(SqlGetPreviousRevision);
    }
});
