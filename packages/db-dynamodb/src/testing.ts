import { createRegisterExtensionPlugin } from "@webiny/handler";
import { DbRegistryFeature } from "@webiny/db/exports/api/db.js";

/**
 * @deprecated Test-only storage-preset glue: registers `DbRegistry`, which the DDB-ES CMS storage
 * resolves in `beforeInit` to stage the entities it syncs to OpenSearch. (It used to also set a
 * legacy `context.db` bag, but nothing reads `context.db` anymore, so that's gone.) Used only by the
 * DDB / DDB-ES `setupFile.js` test presets — remove once those register `DbRegistryFeature`
 * themselves, the way production does via `registerRequestStorage`.
 */
export const dbPlugins = () => {
    const plugin = createRegisterExtensionPlugin(async context => {
        DbRegistryFeature.register(context.container);
    });
    plugin.name = "db-dynamodb/extension/db";
    return [plugin];
};
