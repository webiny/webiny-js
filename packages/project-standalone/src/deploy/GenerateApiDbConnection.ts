import { replaceInPath } from "replace-in-path";
import {
    BuildAppWorkspaceService,
    GetApp,
    GetProjectConfigService,
    GetProjectService,
    LoggerService
} from "@webiny/project/abstractions/index.js";
import { getStandaloneDatabase } from "./getStandaloneDbDriver.js";

/**
 * Generate the api composition root's database connection and storage from the DB infra extension
 * declared in webiny.config.tsx (`<Infra.Sqlite>` / `<Infra.Postgres>` / `<Infra.Pglite>`).
 * The api entry template ships with `__WEBINY_DB_CONNECTION__` / `__WEBINY_STORAGE__` placeholders;
 * after the base workspace build copies it in, this decorator resolves the configured database and
 * substitutes the matching connection factory and storage (each imported from its own module path,
 * so only the chosen driver and storage are traced into the bundle). The handler stays the same
 * (`createSqlApiHandler`): SQLite runs the SQLite storage, Postgres and PGlite the Postgres storage.
 *
 * This decorates the workspace build (rather than an ApiBeforeBuild hook) so it runs right after the
 * template is copied — the entry file must exist to substitute — and in both `build` and `watch`.
 */
const DATABASES = {
    sqlite: {
        connection: {
            name: "createSqliteConnection",
            modulePath: "@webiny/api-storage-sqlite/createSqliteConnection.js"
        },
        storage: {
            name: "createSqliteStorage",
            modulePath: "@webiny/api-storage-sqlite/createSqliteStorage.js"
        }
    },
    postgres: {
        connection: {
            name: "createPgConnection",
            modulePath: "@webiny/api-storage-pg/createPgConnection.js"
        },
        storage: {
            name: "createPgStorage",
            modulePath: "@webiny/api-storage-pg/createPgStorage.js"
        }
    }
} as const;

class GenerateApiDbConnectionImpl implements BuildAppWorkspaceService.Interface {
    constructor(
        private getProjectConfigService: GetProjectConfigService.Interface,
        private getProjectService: GetProjectService.Interface,
        private logger: LoggerService.Interface,
        private decoratee: BuildAppWorkspaceService.Interface
    ) {}

    async execute(appName: GetApp.AppName, options: BuildAppWorkspaceService.Options = {}) {
        // Copy the app template into the workspace first — the entry file must exist to substitute.
        await this.decoratee.execute(appName, options);

        // The database connection lives in the api app only.
        if (appName !== "api") {
            return;
        }

        const { driver } = await getStandaloneDatabase(this.getProjectConfigService);
        const { connection, storage } = DATABASES[driver];

        const project = this.getProjectService.execute();
        const entryFile = project.paths.workspaceFolder
            .join("apps", "api", "graphql", "src", "index.ts")
            .toString();

        // The template imports the placeholders from the real package (so it parses, lints, and passes
        // dependency checks). Rewrite those imports to the chosen connection's and storage's own
        // module paths — so nft traces only the selected driver into the bundle — then swap the call
        // sites. replaceInPath treats `find` as a regex, so the literal patterns are escaped.
        const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const placeholderConnectionImport =
            'import { __WEBINY_DB_CONNECTION__ } from "@webiny/api-storage-sqlite";';
        const placeholderStorageImport =
            'import { __WEBINY_STORAGE__ } from "@webiny/api-storage-sqlite";';

        replaceInPath(entryFile, [
            {
                find: escapeRegExp(placeholderConnectionImport),
                replaceWith: `import { ${connection.name} } from "${connection.modulePath}";`
            },
            { find: escapeRegExp("__WEBINY_DB_CONNECTION__("), replaceWith: `${connection.name}(` },
            {
                find: escapeRegExp(placeholderStorageImport),
                replaceWith: `import { ${storage.name} } from "${storage.modulePath}";`
            },
            { find: escapeRegExp("__WEBINY_STORAGE__("), replaceWith: `${storage.name}(` }
        ]);

        this.logger.debug("Generated api database connection and storage (%s).", driver);
    }
}

export const GenerateApiDbConnection = BuildAppWorkspaceService.createDecorator({
    decorator: GenerateApiDbConnectionImpl,
    dependencies: [GetProjectConfigService, GetProjectService, LoggerService]
});
