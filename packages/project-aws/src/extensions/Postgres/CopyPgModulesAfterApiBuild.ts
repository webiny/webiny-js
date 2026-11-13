import fs from "fs";
import { ApiAfterBuild, GetApp, UiService } from "@webiny/project/abstractions/index.js";
import { copyPgRuntimeModules } from "./copyPgRuntimeModules.js";

/**
 * After `build api` with `<Infra.Postgres />`: put knex and pg into `graphql/build/node_modules`,
 * so the Lambda functions that run the bundle can load them. The api deploy uploads that folder
 * as it is.
 */
class CopyPgModulesAfterApiBuildImpl implements ApiAfterBuild.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private ui: UiService.Interface
    ) {}

    async execute() {
        const graphqlFolder = this.getApp.execute("api").paths.workspaceFolder.join("graphql");
        const buildDir = graphqlFolder.join("build").toString();
        if (!fs.existsSync(buildDir)) {
            return;
        }

        const { packages, files } = await copyPgRuntimeModules({
            resolveFrom: graphqlFolder.toString(),
            buildDir
        });

        this.ui.info(
            "Copied knex and pg into the API build (%s package(s), %s file(s)).",
            packages.length,
            files
        );
    }
}

export const CopyPgModulesAfterApiBuild = ApiAfterBuild.createImplementation({
    implementation: CopyPgModulesAfterApiBuildImpl,
    dependencies: [GetApp, UiService]
});
