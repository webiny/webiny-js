import readJson from "load-json-file";
import writeJson from "write-json-file";

import { PackageJson } from "@webiny/cli-plugin-scaffold/types";

export default async (packageJsonPath, pathToAdd) => {
    const rootPackageJson = await readJson<PackageJson>(packageJsonPath);
    if (!rootPackageJson.workspaces.packages.includes(pathToAdd)) {
        rootPackageJson.workspaces.packages.push(pathToAdd);
        await writeJson(packageJsonPath, rootPackageJson);
    }
};
