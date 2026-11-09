import { GetProjectConfigService } from "@webiny/project/abstractions/index.js";
import { Sqlite } from "../extensions/Sqlite.js";
import { Postgres } from "../extensions/Postgres.js";
import {
    LocalPostgres,
    resolveLocalPostgres,
    type ResolvedLocalPostgres
} from "../extensions/LocalPostgres.js";

export type ServerDbDriver = "sqlite" | "postgres";

/**
 * How content (CMS entries, ACO folders) is stored. `sql` is the generic SQL storage that runs on
 * any SQL engine; `pg` is the Postgres-native storage (jsonb entries, a typed search table,
 * an in-transaction folder catalog). The two keep data in different tables, so this is chosen once
 * per project: switching does not move existing data.
 */
export type ServerStorage = "sql" | "pg";

export interface StandaloneDatabase {
    driver: ServerDbDriver;
    storage: ServerStorage;
    /** Set for `<Infra.LocalPostgres>`: the database `watch` / `serve` start for the api. */
    local?: ResolvedLocalPostgres;
}

/**
 * Resolve the standalone database from the DB infra extension declared in webiny.config.tsx
 * (`<Infra.Sqlite>`, `<Infra.Postgres>` or `<Infra.LocalPostgres>`). Exactly one must be configured
 * — fail loud otherwise.
 *
 * Queried without tags: the Infra.* extensions are project-level, not tagged to a specific app, so an
 * app-scoped config query would filter them out.
 */
export const getStandaloneDatabase = async (
    getProjectConfigService: GetProjectConfigService.Interface
): Promise<StandaloneDatabase> => {
    const projectConfig = await getProjectConfigService.execute();

    const sqlite = projectConfig.extensionsByType(Sqlite);
    const postgres = projectConfig.extensionsByType(Postgres);
    const localPostgres = projectConfig.extensionsByType(LocalPostgres);

    const configured = [
        sqlite.length > 0 ? "<Infra.Sqlite>" : null,
        postgres.length > 0 ? "<Infra.Postgres>" : null,
        localPostgres.length > 0 ? "<Infra.LocalPostgres>" : null
    ].filter(Boolean);

    if (configured.length === 0) {
        throw new Error(
            'No database configured. Add <Infra.LocalPostgres />, <Infra.Postgres ... /> or <Infra.Sqlite filename="..." /> to webiny.config.'
        );
    }
    if (configured.length > 1) {
        throw new Error(
            `${configured.join(" and ")} are configured in webiny.config. Configure exactly one database.`
        );
    }

    if (localPostgres.length > 0) {
        return {
            driver: "postgres",
            storage: "pg",
            local: resolveLocalPostgres(localPostgres[0].params)
        };
    }
    if (postgres.length > 0) {
        return { driver: "postgres", storage: postgres[0].params.storage ?? "pg" };
    }
    // The Postgres-native storage needs Postgres; SQLite always uses the generic SQL storage.
    return { driver: "sqlite", storage: "sql" };
};

/** The driver alone: which SQL client the api connects with. */
export const getStandaloneDbDriver = async (
    getProjectConfigService: GetProjectConfigService.Interface
): Promise<ServerDbDriver> => {
    const { driver } = await getStandaloneDatabase(getProjectConfigService);
    return driver;
};
