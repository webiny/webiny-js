import { createImplementation } from "@webiny/di";
import { GetProjectService, ListPackagesService } from "../../abstractions/index.js";
import fs from "fs";
import { PackageJson } from "type-fest";

export class DefaultListPackagesService implements ListPackagesService.Interface {
    constructor(private getProjectService: GetProjectService.Interface) {}

    async execute() {
        const project = this.getProjectService.execute();

        // List all packages in `packages` folder.
        return fs
            .readdirSync(project.paths.rootFolder.join("packages").toString())
            .map(name => {
                const pkgFolderPath = project.paths.rootFolder.join("/packages/", name);

                let webinyConfigPath = pkgFolderPath.join("webiny.config.ts");
                if (!webinyConfigPath.existsSync()) {
                    webinyConfigPath = pkgFolderPath.join("webiny.config.js");
                }

                const packageJsonPath = pkgFolderPath.join("package.json");
                if (!packageJsonPath.existsSync() || !webinyConfigPath.existsSync()) {
                    return null;
                }

                return {
                    name: `@webiny/${name}`,
                    paths: {
                        packageFolder: pkgFolderPath,
                        packageJsonFile: packageJsonPath,
                        webinyConfigFile: webinyConfigPath
                    },
                    packageJson: JSON.parse(
                        fs.readFileSync(packageJsonPath.toString(), "utf-8")
                    ) as PackageJson
                } as ListPackagesService.Package;
            })
            .filter(Boolean) as ListPackagesService.Result;
    }
}

export const listPackagesService = createImplementation({
    abstraction: ListPackagesService,
    implementation: DefaultListPackagesService,
    dependencies: [GetProjectService]
});
