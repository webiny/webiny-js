import { createImplementation } from "@webiny/di";
import { GetProjectService, ListPackagesService } from "../../abstractions/index.js";
import fs from "fs";
import path from "path";

export class DefaultListPackagesService implements ListPackagesService.Interface {
    constructor(private getProjectService: GetProjectService.Interface) {}

    async execute() {
        const project = this.getProjectService.execute();

        // List all packages in `packages` folder.
        const list: ListPackagesService.Result = fs
            .readdirSync(project.paths.rootFolder.join("packages").toString())
            .map(name => {
                const pkgFolderPath = project.paths.rootFolder.join("/packages/", name).toString();

                let webinyConfigPath = path.join(pkgFolderPath, "webiny.config.ts");
                if (!fs.existsSync(webinyConfigPath)) {
                    webinyConfigPath = path.join(pkgFolderPath, "webiny.config.js");
                }

                return {
                    name: `@webiny/${name}`,
                    paths: {
                        packageFolder: pkgFolderPath,
                        webinyConfigFile: webinyConfigPath
                    }
                } as ListPackagesService.Package;
            })
            .filter(Boolean);

        return list;
    }
}

export const listPackagesService = createImplementation({
    abstraction: ListPackagesService,
    implementation: DefaultListPackagesService,
    dependencies: [GetProjectService]
});
