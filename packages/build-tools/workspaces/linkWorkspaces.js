/**
 * This tool will re-link monorepo packages to one of the following directories (by priority):
 * - {package}/package.json -> publishConfig.directory
 * - lerna.json -> command.publish.contents
 * - package root directory
 */

import "tsx";

import path from "path";
import get from "lodash/get.js";
import fs from "fs-extra";
import * as rimraf from "rimraf";
import readJsonSync from "read-json-sync";

async function symlink(src, dest) {
    if (process.platform !== "win32") {
        // use relative paths otherwise which will be retained if the directory is moved
        src = path.relative(path.dirname(dest), src);
        // When path.relative returns an empty string for the current directory, we should instead use
        // '.', which is a valid fs.symlink target.
        src = src || ".";
    }

    try {
        const stats = await fs.lstat(dest);
        if (stats.isSymbolicLink()) {
            const resolved = dest;
            if (resolved === src) {
                return;
            }
        }
    } catch (err) {
        if (err.code !== "ENOENT") {
            throw err;
        }
    }
    // We use rimraf for unlink which never throws an ENOENT on missing target
    rimraf.sync(dest);

    if (process.platform === "win32") {
        // use directory junctions if possible on win32, this requires absolute paths
        await fs.symlink(src, dest, "junction");
    } else {
        await fs.symlink(src, dest);
    }
}

const defaults = {
    whitelist: [],
    blacklist: []
};

export const linkWorkspaces = async ({ whitelist, blacklist } = defaults) => {
    console.log(`Linking project workspaces...`);
    //eslint-disable-next-line import/dynamic-import-chunkname
    const { PackageJson } = await import("../utils/PackageJson.js");

    whitelist = (whitelist || []).map(p => path.resolve(p));
    blacklist = (blacklist || []).map(p => path.resolve(p));
    // Filter packages to only those in the whitelisted folders
    //eslint-disable-next-line import/dynamic-import-chunkname
    const getYarnWorkspaces = await import("get-yarn-workspaces").then(m => m.default ?? m);
    const packages = getYarnWorkspaces(process.cwd())
        .map(pkg => pkg.replace(/\//g, path.sep))
        .filter(pkg => {
            const isBlacklisted = blacklist.some(b => pkg.startsWith(b));
            if (isBlacklisted) {
                return false;
            } else if (whitelist.length === 0) {
                return true;
            }
            return whitelist.some(w => pkg.startsWith(w));
        });

    const lernaJson = path.resolve("lerna.json");
    const lerna = fs.existsSync(lernaJson) ? readJsonSync(lernaJson) : null;

    for (let i = 0; i < packages.length; i++) {
        const packageJson = path.resolve(packages[i], "package.json");
        if (!fs.existsSync(packageJson)) {
            continue;
        }

        const pkgJson = await PackageJson.fromFile(packageJson);
        const pkg = pkgJson.getJson();

        let targetDirectory = get(pkg, "publishConfig.directory");
        if (!targetDirectory && lerna) {
            targetDirectory = get(lerna, "command.publish.contents");
        }

        const link = path.resolve("node_modules", pkg.name);
        const target = path.resolve(packages[i], targetDirectory || ".");

        if (!fs.existsSync(target)) {
            fs.mkdirpSync(target);
        }

        try {
            await fs.mkdirp(path.dirname(link));
            await symlink(target, link);
        } catch (err) {
            console.log(`Failed ${pkg.name}: ${err.message}`);
        }
    }
};
