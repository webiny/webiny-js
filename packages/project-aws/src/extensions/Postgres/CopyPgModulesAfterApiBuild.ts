import fs from "fs";
import { ApiAfterBuild, GetApp, UiService } from "@webiny/project/abstractions/index.js";
import { copyPgRuntimeModules } from "./copyPgRuntimeModules.js";

/**
 * The api bundles that load knex and pg at runtime: `build` for the Lambda functions and `build-web`
 * for the Lambda web function. `build-web` exists only when the web function is on.
 */
const BUILD_FOLDERS = ["build", "build-web"];

/**
 * After `build api` with `<Infra.Postgres />`: put knex and pg into each bundle's `node_modules`, so
 * the functions that run it can load them. The api deploy uploads those folders as they are.
 */
class CopyPgModulesAfterApiBuildImpl implements ApiAfterBuild.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private ui: UiService.Interface
    ) {}

    async execute() {
        const graphqlFolder = this.getApp.execute("api").paths.workspaceFolder.join("graphql");

        for (const buildFolder of BUILD_FOLDERS) {
            const buildDir = graphqlFolder.join(buildFolder).toString();
            if (!fs.existsSync(buildDir)) {
                continue;
            }

            const { packages, files } = await copyPgRuntimeModules({
                resolveFrom: graphqlFolder.toString(),
                buildDir
            });

            this.ui.info(
                "Copied knex and pg into the API's %s (%s package(s), %s file(s)).",
                buildFolder,
                packages.length,
                files
            );
        }
    }
}

export const CopyPgModulesAfterApiBuild = ApiAfterBuild.createImplementation({
    implementation: CopyPgModulesAfterApiBuildImpl,
    dependencies: [GetApp, UiService]
});
