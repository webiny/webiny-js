import { GetProjectConfigService } from "@webiny/project/abstractions/index.js";
import { Sqlite } from "../extensions/Sqlite.js";
import { Postgres } from "../extensions/Postgres.js";
import { Pglite, resolvePglite, type ResolvedPglite } from "../extensions/Pglite.js";

export type ServerDbDriver = "sqlite" | "postgres";

/**
 * The api's database. The driver picks the storage too: SQLite runs the SQLite storage
 * (`@webiny/api-storage-sqlite`), Postgres and PGlite the Postgres storage (`@webiny/api-storage-pg`).
 */
export interface StandaloneDatabase {
    driver: ServerDbDriver;
    /** Set for `<Infra.Pglite>`: the database `watch` / `serve` start for the api. */
    pglite?: ResolvedPglite;
}

/**
 * Resolve the standalone database from the DB infra extension declared in webiny.config.tsx
 * (`<Infra.Sqlite>`, `<Infra.Postgres>` or `<Infra.Pglite>`). Exactly one must be configured
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
    const pglite = projectConfig.extensionsByType(Pglite);

    const configured = [
        sqlite.length > 0 ? "<Infra.Sqlite>" : null,
        postgres.length > 0 ? "<Infra.Postgres>" : null,
        pglite.length > 0 ? "<Infra.Pglite>" : null
    ].filter(Boolean);

    if (configured.length === 0) {
        throw new Error(
            'No database configured. Add <Infra.Pglite />, <Infra.Postgres ... /> or <Infra.Sqlite filename="..." /> to webiny.config.'
        );
    }
    if (configured.length > 1) {
        throw new Error(
            `${configured.join(" and ")} are configured in webiny.config. Configure exactly one database.`
        );
    }

    if (pglite.length > 0) {
        return { driver: "postgres", pglite: resolvePglite(pglite[0].params) };
    }
    if (postgres.length > 0) {
        return { driver: "postgres" };
    }
    return { driver: "sqlite" };
};

/** The driver alone: which SQL client the api connects with. */
export const getStandaloneDbDriver = async (
    getProjectConfigService: GetProjectConfigService.Interface
): Promise<ServerDbDriver> => {
    const { driver } = await getStandaloneDatabase(getProjectConfigService);
    return driver;
};
