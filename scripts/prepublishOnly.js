const path = require("path");
const get = require("lodash.get");
const fs = require("fs-extra");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");

(async () => {
    // Copy package.json files
    const whitelist = path.resolve("packages");
    const packages = require("get-yarn-workspaces")()
        .map(pkg => pkg.replace(/\//g, path.sep))
        .reduce((acc, pkg) => {
            if (pkg.startsWith(whitelist)) {
                acc.push(pkg);
            }
            return acc;
        }, []);

    for (let i = 0; i < packages.length; i++) {
        try {
            const packageJson = path.resolve(packages[i], "package.json");
            if (!fs.existsSync(packageJson)) {
                continue;
            }

            const pkg = require(packageJson);

            if (pkg.private) {
                continue;
            }

            const distDirectoryName = get(pkg, "publishConfig.directory");
            const distDirectory = path.resolve(packages[i], distDirectoryName);

            const distPackageJson = path.join(distDirectory, "package.json");

            // Copy package.json only if dist directory is different from package root
            if (distDirectoryName !== ".") {
                if (fs.existsSync(distPackageJson)) {
                    await fs.unlink(distPackageJson);
                }

                await fs.copyFile(packageJson, distPackageJson);
            }

            // Lock dependency versions
            const lockPackageJson = await loadJson(distPackageJson);
            if (!lockPackageJson.dependencies) {
                continue;
            }

            Object.keys(lockPackageJson.dependencies)
                .filter(key => !key.startsWith("@webiny"))
                .forEach(key => {
                    const pkgJsonPath = require.resolve(`${key}/package.json`, {
                        paths: [distDirectory]
                    });
                    const { version } = require(pkgJsonPath);
                    lockPackageJson.dependencies[key] = version;
                });

            await writeJson(distPackageJson, lockPackageJson);
        } catch (err) {
            console.log(`Failed ${packages[i].name}: ${err.message}`);
            throw err;
        }
    }
})();
