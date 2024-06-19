import execa from "execa";
import loadJson from "load-json-file";
import writeJson from "write-json-file";
import type { ExtensionWorkspace } from "./getExtensionsFromFilesystem";
import { PackageJson } from "@webiny/cli-plugin-scaffold/types";
import { formatCode } from "@webiny/cli-plugin-scaffold/utils";

export const registerWorkspaces = async (extensions: ExtensionWorkspace[]) => {
    const packageJsonPath = "package.json";
    const rootPkgJson = await loadJson<PackageJson>(packageJsonPath);

    extensions.forEach(extension => {
        const workspacePath = extension.path.replace(`${process.cwd()}/`, "");

        if (!rootPkgJson.workspaces.packages.includes(workspacePath)) {
            rootPkgJson.workspaces.packages.push(workspacePath);
        }
    });

    await writeJson(packageJsonPath, rootPkgJson);
    await formatCode(packageJsonPath, {});

    await execa("yarn");
};
