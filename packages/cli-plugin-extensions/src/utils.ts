import readJson from "load-json-file";
import { PackageJson } from "@webiny/cli-plugin-scaffold/types";
import writeJson from "write-json-file";

export const updateDependencies = async (
    packageJsonPath: string,
    dependencies: Record<string, string>
) => {
    // Update dependencies list in package.json.
    const packageJson = await readJson<PackageJson>(packageJsonPath);
    if (!packageJson.dependencies) {
        packageJson.dependencies = {};
    }

    Object.assign(packageJson.dependencies, dependencies);

    await writeJson(packageJsonPath, packageJson);
};
