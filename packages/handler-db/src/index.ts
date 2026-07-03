import type { ConstructorArgs } from "@webiny/db";
import { Db } from "@webiny/db";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import type { DbContext } from "./types.js";
import { DbRegistryFeature } from "@webiny/db/exports/api/db.js";

export { DbFeature } from "./DbFeature.js";
export type { DbFeatureConfig } from "./DbFeature.js";
export { DynamoDBClient, DynamoDBClientFeature, DbInstance } from "./abstractions.js";

export default <T = unknown>(args: ConstructorArgs<T>) => {
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
