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
    // Delete previous cache!
    await fs.emptyDir(cacheFolderPath);
    await fs.copy(buildFolder, cacheFolderPath);
};

export const buildPackageInSameProcess = async (pkg: Package, buildOverrides = "{}") => {
    const configPath = path.join(pkg.packageFolder, "webiny.config").replace(/\\/g, "/");

    const config = require(configPath);
    await config.commands.build({
        // We don't want debug nor regular logs logged within the build command.
        logs: false,
        debug: false,
        overrides: buildOverrides
    });

    // Copy and paste built code into the cache folder.
    const cacheFolderPath = path.join(CACHE_FOLDER_PATH, pkg.packageJson.name);

    const buildFolder = getBuildOutputFolder(pkg);

    // Delete previous cache!
    await fs.emptyDir(cacheFolderPath);
    await fs.copy(buildFolder, cacheFolderPath);
};
