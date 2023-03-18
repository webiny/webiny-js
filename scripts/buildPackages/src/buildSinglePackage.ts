import path from "path";
import fs from "fs-extra";
import execa from "execa";
import { Package } from "./types";
import { getBuildOutputFolder } from "./getBuildOutputFolder";
import { CACHE_FOLDER_PATH } from "./constants";

export const buildPackageInNewProcess = async (pkg: Package, buildOverrides = "{}") => {
    // Run build script using execa
    await execa("yarn", ["build", "--overrides", buildOverrides], {
        cwd: pkg.packageFolder
    });

    const cacheFolderPath = path.join(CACHE_FOLDER_PATH, pkg.packageJson.name);

    const buildFolder = getBuildOutputFolder(pkg);
    fs.copySync(buildFolder, cacheFolderPath);
};
