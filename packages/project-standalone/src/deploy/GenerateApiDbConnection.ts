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
 * The api entry template ships with `__WEBINY_DB_FACTORY__` / `__WEBINY_API_HANDLER__` placeholders;
 * after the base workspace build copies it in, this decorator resolves the configured database and
 * substitutes the matching connection factory and api handler (each imported from its own module
 * path, so only the chosen driver and storage are traced into the bundle).
 *
 * This decorates the workspace build (rather than an ApiBeforeBuild hook) so it runs right after the
 * template is copied — the entry file must exist to substitute — and in both `build` and `watch`.
 */
const FACTORIES = {
    sqlite: {
        name: "createSqliteConnection",
        modulePath: "@webiny/api-event-handler-standalone-sql/createSqliteConnection.js"
    },
    postgres: {
        name: "createPostgresConnection",
        modulePath: "@webiny/api-event-handler-standalone-sql/createPostgresConnection.js"
    }
} as const;

const HANDLERS = {
    sql: {
        name: "createSqlApiHandler",
        modulePath: "@webiny/api-event-handler-standalone-sql"
    },
    pg: {
        name: "createPgApiHandler",
        modulePath: "@webiny/api-event-handler-standalone-pg"
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

        const { driver, storage } = await getStandaloneDatabase(this.getProjectConfigService);
        const factory = FACTORIES[driver];
        const handler = HANDLERS[storage];

        const project = this.getProjectService.execute();
        const entryFile = project.paths.workspaceFolder
            .join("apps", "api", "graphql", "src", "index.ts")
            .toString();

        // The template imports the placeholder from the real package (so it parses, lints, and passes
        // dependency checks). Rewrite that import to the chosen factory's own module path — so nft
        // traces only the selected driver into the bundle — then swap the call site. replaceInPath
        // treats `find` as a regex, so the literal patterns are escaped.
        const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const placeholderImport =
            'import { __WEBINY_DB_FACTORY__ } from "@webiny/api-event-handler-standalone-sql";';
        const placeholderHandlerImport =
            'import { __WEBINY_API_HANDLER__ } from "@webiny/api-event-handler-standalone-sql";';

        replaceInPath(entryFile, [
            {
                find: escapeRegExp(placeholderImport),
                replaceWith: `import { ${factory.name} } from "${factory.modulePath}";`
            },
            { find: escapeRegExp("__WEBINY_DB_FACTORY__("), replaceWith: `${factory.name}(` },
            {
                find: escapeRegExp(placeholderHandlerImport),
                replaceWith: `import { ${handler.name} } from "${handler.modulePath}";`
            },
            { find: escapeRegExp("__WEBINY_API_HANDLER__("), replaceWith: `${handler.name}(` }
        ]);

        this.logger.debug("Generated api database connection (%s, %s storage).", driver, storage);
    }
}

export const GenerateApiDbConnection = BuildAppWorkspaceService.createDecorator({
    decorator: GenerateApiDbConnectionImpl,
    dependencies: [GetProjectConfigService, GetProjectService, LoggerService]
});
