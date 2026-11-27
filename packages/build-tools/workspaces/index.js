import fs from "fs";
import path from "path";
import { listWorkspaces } from "@webiny/stdlib/node";
export { linkWorkspaces } from "./linkWorkspaces";

const hasPackageJson = p => fs.existsSync(p + "/package.json");

export const allWorkspaces = () => {
    return listWorkspaces()
        .map(pkg => {
            return pkg.path;
        })
        .filter(hasPackageJson)
        .map(pkg => pkg.replace(/\//g, path.sep));
};
