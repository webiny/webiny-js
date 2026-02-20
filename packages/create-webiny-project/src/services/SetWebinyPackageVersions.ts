import { loadJsonFileSync } from "load-json-file";
import { writeJsonFileSync } from "write-json-file";
import { GetCwpVersion } from "./GetCwpVersion.js";
import { GetProjectRootPath } from "./GetProjectRootPath.js";
import { CliParams } from "../types.js";
import path from "path";

export class SetWebinyPackageVersions {
    async execute(cliArgs: CliParams) {
        const getProjectRootPath = new GetProjectRootPath();
        const projectRootPath = getProjectRootPath.execute(cliArgs);

        const getCwpVersion = new GetCwpVersion();
        const cwpVersion = await getCwpVersion.execute();

        const projectPackageJsonPath = path.join(projectRootPath, "package.json");
        const projectPackageJson = loadJsonFileSync<Record<string, any>>(projectPackageJsonPath);

        for (const dependency in projectPackageJson.dependencies) {
            if (this.isWebinyDependency(dependency)) {
                projectPackageJson.dependencies[dependency] = cwpVersion;
            }
        }

        for (const dependency in projectPackageJson.devDependencies) {
            if (this.isWebinyDependency(dependency)) {
                projectPackageJson.devDependencies[dependency] = cwpVersion;
            }
        }

        writeJsonFileSync(projectPackageJsonPath, projectPackageJson);
    }

    private isWebinyDependency(depName: string): boolean {
        return depName === "webiny" || depName.startsWith("@webiny/");
    }
}
