import { createImplementation } from "@webiny/di";
import { PackageJson } from "@webiny/build-tools/utils/PackageJson.js";
import { GetAppPackagesService } from "~/abstractions/index.js";
import { type AppModel, AppPackageModel } from "~/models/index.js";
import glob from "fast-glob";
import { dirname } from "path";

export class DefaultGetAppPackagesService implements GetAppPackagesService.Interface {
    async execute(app: AppModel) {
        const globPattern = app.paths.workspaceFolder
            .join("**/webiny.config.ts")
            .toString()
            .replace(/\\/g, "/");

        const webinyConfigsPaths = await glob(globPattern);

        return Promise.all(
            webinyConfigsPaths.map(async configPath => {
                const packageFolderPath = dirname(configPath);
                const packageJson = await PackageJson.findClosest(packageFolderPath);
                return AppPackageModel.fromDto({
                    name: packageJson.getJson().name,
                    paths: {
                        packageFolder: packageFolderPath,
                        packageJsonFile: packageJson.getLocation(),
                        webinyConfigFile: configPath
                    },
                    packageJson: packageJson.getJson()
                });
            })
        );
    }
}

export const getAppPackagesService = createImplementation({
    abstraction: GetAppPackagesService,
    implementation: DefaultGetAppPackagesService,
    dependencies: []
});
