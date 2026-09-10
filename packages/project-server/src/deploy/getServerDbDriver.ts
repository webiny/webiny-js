import { GetProjectConfigService } from "@webiny/project/abstractions/index.js";

export type ServerDbDriver = "sqlite" | "postgres";

/**
 * Resolve the self-hosted database driver from the DB infra extension declared in webiny.config.tsx
 * (`<Infra.Sqlite>` / `<Infra.Postgres>`). Exactly one must be configured — fail loud otherwise.
 *
 * Queried without tags: the Infra.* extensions are project-level, not tagged to a specific app, so an
 * app-scoped config query would filter them out.
 */
export const getServerDbDriver = async (
    getProjectConfigService: GetProjectConfigService.Interface
): Promise<ServerDbDriver> => {
    const projectConfig = await getProjectConfigService.execute();

    const hasSqlite = projectConfig.extensionsByType("Infra/Sqlite").length > 0;
    const hasPostgres = projectConfig.extensionsByType("Infra/Postgres").length > 0;

    if (hasSqlite === hasPostgres) {
        throw new Error(
            hasSqlite
                ? "Both <Infra.Sqlite> and <Infra.Postgres> are configured in webiny.config. Configure exactly one."
                : 'No database configured. Add <Infra.Sqlite filename="..." /> or <Infra.Postgres ... /> to webiny.config.'
        );
    }

    return hasPostgres ? "postgres" : "sqlite";
};
