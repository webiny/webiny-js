import { replaceInPath } from "replace-in-path";
import {
    BuildAppWorkspaceService,
    GetApp,
    GetProjectConfigService,
    GetProjectService,
    LoggerService
} from "@webiny/project/abstractions/index.js";
import { getServerDbDriver } from "./getServerDbDriver.js";

/**
 * Generate the api composition root's database connection from the DB infra extension declared in
 * webiny.config.tsx (`<Infra.Sqlite>` / `<Infra.Postgres>`). The api entry template ships with
 * `{DB_FACTORY}` / `{DB_FACTORY_PATH}` placeholders; after the base workspace build copies it in, this
 * decorator resolves the configured database and substitutes the matching connection factory (imported
 * from its own module path).
 *
 * This decorates the workspace build (rather than an ApiBeforeBuild hook) so it runs right after the
 * template is copied — the entry file must exist to substitute — and in both `build` and `watch`.
 */
const FACTORIES = {
    sqlite: {
        name: "createSqliteConnection",
        modulePath: "@webiny/api-event-handler-server-sql/createSqliteConnection.js"
    },
    postgres: {
        name: "createPostgresConnection",
        modulePath: "@webiny/api-event-handler-server-sql/createPostgresConnection.js"
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

        const driver = await getServerDbDriver(this.getProjectConfigService);
        const factory = FACTORIES[driver];

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
            'import { __WEBINY_DB_FACTORY__ } from "@webiny/api-event-handler-server-sql";';

        replaceInPath(entryFile, [
            {
                find: escapeRegExp(placeholderImport),
                replaceWith: `import { ${factory.name} } from "${factory.modulePath}";`
            },
            { find: escapeRegExp("__WEBINY_DB_FACTORY__("), replaceWith: `${factory.name}(` }
        ]);

        this.logger.debug("Generated api database connection (%s).", driver);
    }
}

export const GenerateApiDbConnection = BuildAppWorkspaceService.createDecorator({
    decorator: GenerateApiDbConnectionImpl,
    dependencies: [GetProjectConfigService, GetProjectService, LoggerService]
});
