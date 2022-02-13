import readJson from "load-json-file";
import writeJson from "write-json-file";

import { PackageJson } from "~/types";

export default async (packageJsonPath: string, pathToAdd: string): Promise<void> => {
    // Ensure forward slashes are used.
    pathToAdd = pathToAdd.replace(/\\/g, "/");

    const rootPackageJson = await readJson<PackageJson>(packageJsonPath);
    if (!rootPackageJson.workspaces.packages.includes(pathToAdd)) {
        rootPackageJson.workspaces.packages.push(pathToAdd);
        await writeJson(packageJsonPath, rootPackageJson);
    }
};
