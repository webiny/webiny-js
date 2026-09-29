import { listWorkspaces } from "@webiny/stdlib/node";

let workspacePackageNames: Set<string> | undefined;

/*
 * Names of the packages that live in this repo. They are all released together under one version,
 * which is what lets the locked dependencies pin them by stripping the caret.
 *
 * Read once and reused, since every package being prepared asks.
 */
export const getWorkspacePackageNames = (): Set<string> => {
    if (!workspacePackageNames) {
        workspacePackageNames = new Set(listWorkspaces().map(workspace => workspace.name));
    }

    return workspacePackageNames;
};
