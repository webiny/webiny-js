import { createRegisterExtensionPlugin } from "@webiny/handler";
import type { Knex } from "knex";
import { KnexClientFeature } from "./feature/KnexClient/index.js";

export { createApiCoreSql } from "./createApiCoreSql.js";
export { ApiCoreSqlFeature } from "./coreStorage/index.js";
export { SqlConnectionFeature, setSqlServiceManifestLoader } from "./connection/index.js";
export type { SqlConnectionConfig } from "./connection/index.js";
export { getSqlTablePrefix } from "./getSqlTablePrefix.js";
export { TableManager } from "./TableManager.js";
export type { TableManagerOptions } from "./TableManager.js";
export { SqlSchemaConfig } from "./schemaConfig/index.js";
export { SqlSchemaSetup, SqlSchemaSetupRunner, runSchemaSetupSteps } from "./schemaSetup/index.js";
export type {
    ISqlSchemaSetupRequest,
    RequiredSqlSchemaSetup,
    RunSchemaSetupStepsParams,
    SqlSchemaSetupRunParams
} from "./schemaSetup/index.js";
export { getSchemaMemory } from "./schemaMemory/getSchemaMemory.js";
export { getConnectionKey } from "./schemaMemory/getConnectionKey.js";
export { ensureTable, createTableIfMissing, recordTable } from "./schemaMemory/ensureTable.js";
export type { EnsureTableParams, TableCreator } from "./schemaMemory/ensureTable.js";
export type { ISchemaMemory } from "./schemaMemory/getSchemaMemory.js";
export type { SqlStorage } from "./storage/types.js";
export * from "./connectionRetry/index.js";
export { SqlServiceManifestLoader, SqlServiceManifestWriter } from "./serviceDiscovery/index.js";

export { KnexClient } from "./feature/KnexClient/index.js";

interface IRegisterApiCoreSqlExtension {
    knex: Knex;
}

export const registerSQLCore = ({ knex }: IRegisterApiCoreSqlExtension) => {
    return createRegisterExtensionPlugin(async context => {
        KnexClientFeature.register(context.container, knex);
    });
};
