/**
 * Webiny API handler for the standalone Node server transport with the Postgres-native storage.
 *
 * The same handler as `createSqlApiHandler` (self-hosted auth on the SQL storage), with the Postgres
 * storage of `@webiny/api-storage-pg`, which the AWS Lambda handler uses too: core, websockets and
 * audit logs on the SQL storage, CMS entries in a jsonb table with a typed search table, and ACO
 * folder-level permissions in a folder catalog kept in the same transaction as folder writes (no
 * background tasks).
 *
 * Postgres only. The caller supplies the Knex client.
 */
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { registerPgRootStorage } from "@webiny/api-storage-pg";
import {
    createSqlApiHandler,
    type ContentStorage,
    type CreateSqlApiHandlerConfig
} from "@webiny/api-event-handler-standalone-sql";
import { HeadlessCmsPgFeature, readPgStorageSettings } from "@webiny/api-headless-cms-pg";
import { AcoPgFeature } from "@webiny/api-aco-pg";

/**
 * The content half of the Postgres storage, for callers that build their own handler on
 * `createSqlApiHandler({ contentStorage })`.
 *
 * @deprecated Pass `storage: registerPgRootStorage` (`@webiny/api-storage-pg`) instead, or use
 * `createPgApiHandler`.
 */
export const pgContentStorage: ContentStorage = {
    register(container, { knex, tableNamePrefix, buildParams }) {
        // The `Pg*` build params (`<Infra.Postgres cmsStorage>`), read once for the root storage.
        HeadlessCmsPgFeature.register(container, {
            knex,
            tableNamePrefix,
            settings: readPgStorageSettings(buildParams)
        });
    },
    extensions() {
        // Folder-level permissions from the folder catalog, instead of the task-maintained one.
        return [
            createRegisterExtensionPlugin(context => {
                AcoPgFeature.register(context.container);
            })
        ];
    }
};

export type CreatePgApiHandlerConfig = Omit<
    CreateSqlApiHandlerConfig,
    "contentStorage" | "storage"
>;

export function createPgApiHandler(config: CreatePgApiHandlerConfig) {
    return createSqlApiHandler({ ...config, storage: registerPgRootStorage });
}
