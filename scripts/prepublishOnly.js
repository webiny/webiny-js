const path = require("path");
const get = require("lodash.get");
const fs = require("fs-extra");

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

            const targetDirectory = get(pkg, "publishConfig.directory");
            if (targetDirectory === ".") {
                continue;
            }

            const target = path.resolve(packages[i], targetDirectory);

            await fs.unlink(path.join(target, "package.json"));
            await fs.copyFile(packageJson, path.join(target, "package.json"));
        } catch (err) {
            console.log(`Failed ${packages[i].name}: ${err.message}`);
            throw err;
        }
    }
})();
