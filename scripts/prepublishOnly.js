const path = require("path");
const get = require("lodash.get");
const fs = require("fs-extra");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const resolvePackageVersion = require("./utils/resolvePackageVersion");

// For some packages, we might not want to apply version lock. A good example is @pulumi/pulumi package.
// There were cases where our @webiny/pulumi-sdk package requested @pulumi/pulumi version 3.6.0, but the
// @pulumi/aws requested ^3.0.0, which made it possible for a Webiny project to contain two different
// versions of the @pulumi/aws package - 3.6.0 and 3.7.0.
const IGNORED_PACKAGES = ["@pulumi/pulumi", "@pulumi/aws"];

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

            Object.keys(lockPackageJson.dependencies).forEach(key => {
                if (IGNORED_PACKAGES.includes(key)) {
                    return;
                }

                if (key.startsWith("@webiny/")) {
                    lockPackageJson.dependencies[key] = pkg.version;
                    return;
                }

                const depVersion = lockPackageJson.dependencies[key];
                if (depVersion.startsWith("file:")) {
                    return;
                }

                lockPackageJson.dependencies[key] = resolvePackageVersion(key, {
                    cwd: distDirectory
                });
            });

            await writeJson(distPackageJson, lockPackageJson);
        } catch (err) {
            console.log(`Failed ${packages[i].name}: ${err.message}`);
            throw err;
        }
    }
})();
