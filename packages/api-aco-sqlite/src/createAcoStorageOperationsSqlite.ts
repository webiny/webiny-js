import type { AcoContext, AcoStorageOperations } from "@webiny/api-aco/types.js";
import type { AcoStorageOperationsFactory } from "@webiny/api-aco";
import { createFilterOperations } from "@webiny/api-aco/filter/filter.so.js";
import type { Database } from "@webiny/db-sqlite";
import { createFlpOperations } from "./flp/SqliteFlpStorageOperations.js";

/**
 * Factory of factories — given a SQLite database, returns an
 * `AcoStorageOperationsFactory` suitable for `createAco({
 * storageOperationsFactory })` in extensions/api.
 *
 * Composition:
 *   - `filter` ops: reused verbatim from api-aco core. The filter ops are
 *     CMS-delegating (they call `cms.getEntryById`, `cms.listLatestEntries`,
 *     etc.) — they don't actually touch the DDB documentClient that the
 *     legacy `CreateAcoStorageOperationsParams` type insists on. We pass
 *     `documentClient: undefined as never` so TypeScript is happy; at
 *     runtime the field is unread.
 *   - `flp` ops: new SQLite-backed implementation in this package.
 */
export const createAcoStorageOperationsSqlite = (db: Database): AcoStorageOperationsFactory => {
    return async (context: AcoContext): Promise<AcoStorageOperations> => {
        const filter = createFilterOperations({
            cms: context.cms,
            container: context.container,
            security: context.security,
            documentClient: undefined as never
        });

        const flp = createFlpOperations(db);

        return { filter, flp };
    };
};
