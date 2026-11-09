/**
 * Webiny API handler for the standalone Node server transport with the Postgres-native storage.
 *
 * The same handler as `createSqlApiHandler` (core, websockets, audit logs and self-hosted auth on
 * the SQL storage, which runs on Postgres), with content on the Postgres-native storage: CMS
 * entries in a jsonb table with a typed search table, and ACO folder-level permissions in a folder
 * catalog kept in the same transaction as folder writes (no background tasks).
 *
 * Postgres only. The caller supplies the Knex client.
 */
import { createRegisterExtensionPlugin } from "@webiny/handler";
import {
    createSqlApiHandler,
    type ContentStorage,
    type CreateSqlApiHandlerConfig
} from "@webiny/api-event-handler-standalone-sql";
import { HeadlessCmsPgFeature } from "@webiny/api-headless-cms-pg";
import { AcoPgFeature } from "@webiny/api-aco-pg";

export const pgContentStorage: ContentStorage = {
    register(container, { knex, tableNamePrefix }) {
        HeadlessCmsPgFeature.register(container, { knex, tableNamePrefix });
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

export type CreatePgApiHandlerConfig = Omit<CreateSqlApiHandlerConfig, "contentStorage">;

export function createPgApiHandler(config: CreatePgApiHandlerConfig) {
    return createSqlApiHandler({ ...config, contentStorage: pgContentStorage });
}
