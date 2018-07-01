// @flow
const { readdirSync, statSync } = require("fs");
const { join } = require("path");

// Find all folders in packages/* with package.json
const packagesRoot = join(__dirname, "..", "..", "packages");

const whitelist = [
    "webiny-file-storage",
    "webiny-file-storage-local",
    "webiny-file-storage-s3"
    // TODO "webiny-form",
    // "webiny-i18n",
    // "webiny-i18n-react"
    // "webiny-jimp",
    // "webiny-model",
    //  "webiny-data-extractor",
    //  "webiny-mysql-connection",
    // TODO "webiny-react-router",
    // TODO "webiny-scripts",
    //  "webiny-service-manager",
    //  "webiny-sql-table",
    //  "webiny-sql-table-mysql",
    //  "webiny-sql-table-sync",
    // TODO "webiny-storybook-utils",
    // "webiny-validation"
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
