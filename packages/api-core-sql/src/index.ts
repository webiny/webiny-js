import { createRegisterExtensionPlugin } from "@webiny/handler";
import type { Knex } from "knex";
import { KnexClientFeature } from "./feature/KnexClient/index.js";

export { createApiCoreSql } from "./createApiCoreSql.js";
export { getSqlTablePrefix } from "./getSqlTablePrefix.js";
export { SqlServiceManifestLoader } from "./serviceDiscovery/index.js";

export { KnexClient } from "./feature/KnexClient/index.js";

interface IRegisterApiCoreSqlExtension {
    knex: Knex;
}

export const registerExtension = ({ knex }: IRegisterApiCoreSqlExtension) => {
    return createRegisterExtensionPlugin(async context => {
        KnexClientFeature.register(context.container, knex);
    });
};
