import fs from "fs";
import path from "path";
import { ApiAfterBuild, GetApp, UiService } from "@webiny/project/abstractions/index.js";
import { copyPgRuntimeModules } from "./copyPgRuntimeModules.js";
import { RDS_CA_BUNDLE_FILE, RDS_CA_BUNDLE_SOURCE } from "./rdsCaBundle.js";

/**
 * The api bundles that load knex and pg at runtime: `build` for the Lambda functions and `build-web`
 * for the Lambda web function. `build-web` exists only when the web function is on.
 */
const BUILD_FOLDERS = ["build", "build-web"];

/** The bundle whose function needs the RDS CA bundle shipped with its code (see `rdsCaBundle.ts`). */
const WEB_BUILD_FOLDER = "build-web";

/**
 * After `build api` with `<Infra.AuroraPostgres />`: put knex and pg into each bundle's
 * `node_modules`, so the functions that run it can load them, and the RDS CA bundle into
 * `build-web`, so the web function can verify the database's certificate. The api deploy uploads
 * those folders as they are.
 */
export class CopyPgModulesAfterApiBuildImpl implements ApiAfterBuild.Interface {
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

            if (buildFolder === WEB_BUILD_FOLDER) {
                fs.copyFileSync(RDS_CA_BUNDLE_SOURCE, path.join(buildDir, RDS_CA_BUNDLE_FILE));
                this.ui.info("Copied the RDS CA bundle into the API's %s.", buildFolder);
            }
        }
    }
}

export const CopyPgModulesAfterApiBuild = ApiAfterBuild.createImplementation({
    implementation: CopyPgModulesAfterApiBuildImpl,
    dependencies: [GetApp, UiService]
});
