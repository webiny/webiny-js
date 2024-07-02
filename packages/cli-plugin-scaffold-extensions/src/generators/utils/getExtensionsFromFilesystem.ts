import loadJson from "load-json-file";
import glob from "glob";
import path from "path";
import { PackageJson } from "@webiny/cli-plugin-scaffold/types";

export type ExtensionType = "api" | "admin" | undefined;

export type ExtensionWorkspace = {
    path: string;
    type: ExtensionType;
    packageJson: PackageJson;
};

export const getExtensionsFromFilesystem = (): ExtensionWorkspace[] => {
    const workspaces = glob.sync(`extensions/**/package.json`);
    return workspaces
        .map(pkg => ({
            path: path.dirname(pkg),
            packageJson: loadJson.sync<PackageJson>(pkg)
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
