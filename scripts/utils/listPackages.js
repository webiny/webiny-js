// @flow
const { readdirSync, statSync } = require("fs");
const { join } = require("path");

// Find all folders in packages/* with package.json
const packagesRoot = join(__dirname, "..", "..", "packages");

const whitelist = [
    "webiny-data-extractor",
    "webiny-service-manager",
    "webiny-sql-table",
    "webiny-sql-table-mysql",
    "webiny-sql-table-sync",
    /*"webiny-storybook-utils",*/
    "webiny-validation"
];

module.exports = () => {
    return readdirSync(packagesRoot).filter(dir => {
        if (!whitelist.includes(dir)) {
            return false;
        }

        const packagePath = join(packagesRoot, dir, "package.json");
        return statSync(packagePath).isFile();
    });
};
