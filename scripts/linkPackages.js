/**
 * This tool will re-link monorepo packages to one of the following directories (by priority):
 * - {package}/package.json -> publishConfig.directory
 * - lerna.json -> command.publish.contents
 * - package root directory
 */
const path = require("path");
const get = require("lodash.get");
const fs = require("fs-extra");
const rimraf = require("rimraf");

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

(async () => {
    console.log(`Linking repo packages...`);

    // Filter packages to only those in the whitelisted folders
    const whitelist = [path.resolve("components"), path.resolve("packages")];
    const packages = require("get-yarn-workspaces")()
        .map(pkg => pkg.replace(/\//g, path.sep))
        .reduce((acc, pkg) => {
            whitelist.forEach(w => {
                if (pkg.startsWith(w)) {
                    acc.push(pkg);
                }
            });
            return acc;
        }, []);

    const lernaJson = path.resolve("lerna.json");
    let lerna = fs.existsSync(lernaJson) ? require(lernaJson) : null;

    for (let i = 0; i < packages.length; i++) {
        const packageJson = path.resolve(packages[i], "package.json");
        if (!fs.existsSync(packageJson)) {
            continue;
        }

        const package = require(packageJson);

        let targetDirectory = get(package, "publishConfig.directory");
        if (!targetDirectory && lerna) {
            targetDirectory = get(lerna, "command.publish.contents");
        }

        const link = path.resolve("node_modules", package.name);
        const target = path.resolve(packages[i], targetDirectory || ".");

        try {
            await fs.mkdirp(path.dirname(link));
            await symlink(target, link);
        } catch (err) {
            console.log(`Failed ${package.name}: ${err.message}`);
        }
    }
})();
