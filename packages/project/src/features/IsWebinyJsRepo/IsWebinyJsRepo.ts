import { createImplementation } from "@webiny/di";
import { GetProject, IsWebinyJsRepo } from "~/abstractions/index.js";
import fs from "fs";
import path from "path";

export class DefaultIsWebinyJsRepo implements IsWebinyJsRepo.Interface {
    constructor(private getProject: GetProject.Interface) {}

    execute() {
        const project = this.getProject.execute();
        const projectRootFolderPath = project.paths.rootFolder.toString();
        const adminUiPkgPath = path.join(projectRootFolderPath, "packages", "admin-ui");

        return fs.existsSync(adminUiPkgPath);
    }
}

export const isWebinyJsRepo = createImplementation({
    abstraction: IsWebinyJsRepo,
    implementation: DefaultIsWebinyJsRepo,
    dependencies: [GetProject]
});
