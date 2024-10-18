import loadJson from "load-json-file";
import glob from "glob";
import path from "path";
import { PackageJson } from "@webiny/cli-plugin-scaffold/types";

export type ExtensionType = "api" | "admin" | "pbElement" | undefined;

export type ExtensionWorkspace = {
    paths: {
        root: string;
        packageJson: string;
    };
    type: ExtensionType;
    packageJson: PackageJson;
};

export const getExtensionsFromFilesystem = (): ExtensionWorkspace[] => {
    const workspaces = glob.sync(`extensions/**/package.json`, {
        ignore: ["**/node_modules/**"]
    });
    return workspaces
        .map(workspacePackageJsonPath => ({
            paths: {
                root: path.dirname(workspacePackageJsonPath),
                packageJson: workspacePackageJsonPath
            },
            packageJson: loadJson.sync<PackageJson>(workspacePackageJsonPath),
            packageJsonPath: workspacePackageJsonPath
        }))
        .map(workspace => {
            const typeKeyword = (workspace.packageJson.keywords || []).find(kw => {
                return kw.startsWith("webiny-extension-type:");
            });

            const type = (typeKeyword ? typeKeyword.split(":")[1] : undefined) as ExtensionType;

            return {
                ...workspace,
                type
            };
        });
};
