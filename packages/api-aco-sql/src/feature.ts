import { createFeature } from "@webiny/feature/api";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { TaskCatalogFlpFeature } from "@webiny/api-aco/flpTaskCatalog/index.js";
import { SqlFlpStorageOperations } from "./SqlFlpStorageOperations.js";
import { AcoSqlSchemaSetup } from "./AcoSqlSchemaSetup.js";

/**
 * ACO folder-level permissions on SQL, and the `aco` schema setup step. Registered per request, it
 * runs on the connection (`KnexClient`) and the table settings (`SqlSchemaConfig`) the SQL storage
 * keeps in the root. Folder-level permissions on this storage use the task-maintained FLP catalog.
 */
export const AcoSqlFeature = createFeature({
    name: "AcoSql",
    register(container) {
        container.register(SqlFlpStorageOperations);
        container.register(AcoSqlSchemaSetup);
        TaskCatalogFlpFeature.register(container);
    }
});

/** `AcoSqlFeature` as an extension plugin, for setups that register storages that way. */
export const registerAcoSqlStorageOperations = () => {
    return createRegisterExtensionPlugin(context => {
        AcoSqlFeature.register(context.container);
    });
};
