import type { ConstructorArgs } from "@webiny/db";
import { Db } from "@webiny/db";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { DbRegistryFeature } from "@webiny/db/exports/api/db.js";
import type { Context } from "@webiny/api/types.js";

interface DbContext extends Context {
    db: Db<unknown>;
}

/**
 * @deprecated Test-only storage-preset glue: registers `DbRegistry` and sets the legacy `context.db`
 * bag. Production wires the DB via `DbFeature` (DbInstance + DynamoDBClient DI abstractions) and never
 * reads `context.db`. Used only by the DDB/DDB-ES `setupFile.js` test presets — remove once those
 * move to their own storage-operations factories/drivers (see the setupFile TODO). The `DbRegistry`
 * registration must be preserved (the DDB-ES CMS storage resolves it in `beforeInit`).
 */
export const dbPlugins = <T = unknown>(args: ConstructorArgs<T>) => {
    const plugin = createRegisterExtensionPlugin<DbContext>(async context => {
        if (context.db) {
            return;
        }

        DbRegistryFeature.register(context.container);

        context.db = new Db<T>(args);
    });
    plugin.name = "handler-db/extension/db";
    return [plugin];
};
