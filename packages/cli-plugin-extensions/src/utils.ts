import readJson from "load-json-file";
import { PackageJson } from "@webiny/cli-plugin-scaffold/types";
import writeJson from "write-json-file";
import path from "path";

// @ts-expect-error No types available for this package.
import { getProject } from "@webiny/cli/utils";

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

export const updateWorkspaces = async (location: string) => {
    // Add package to workspaces
    const project = getProject();
    const rootPackageJsonPath = path.join(project.root, "package.json");
    const rootPackageJson = await readJson<PackageJson>(rootPackageJsonPath);
    if (!rootPackageJson.workspaces.packages.includes(location)) {
        rootPackageJson.workspaces.packages.push(location);
        await writeJson(rootPackageJsonPath, rootPackageJson);
    }
};
