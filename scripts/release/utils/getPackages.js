const path = require("path");
const readPkg = require("read-pkg");
const globby = require("globby");

const toPublish = [
    "webiny-api",
    "webiny-api-cms",
    "webiny-app",
    "webiny-app-admin",
    "webiny-app-cms",
    "webiny-ui",
    "webiny-compose",
    "webiny-data-extractor",
    "webiny-entity-memory",
    "webiny-entity-mysql",
    "webiny-entity",
    "webiny-file-storage-local",
    "webiny-file-storage-s3",
    "webiny-file-storage",
    "webiny-form",
    "webiny-i18n-react",
    "webiny-i18n",
    "webiny-jimp",
    "webiny-model",
    "webiny-mysql-connection",
    "webiny-react-router",
    "webiny-service-manager",
    "webiny-sql-table-mysql",
    "webiny-sql-table-sync",
    "webiny-sql-table",
    "webiny-validation"
];

// Get packages to process
module.exports = glob => {
    if (!glob) {
        throw new Error("Missing packages glob!");
    }
    
    return globby
        .sync(glob, { onlyDirectories: true, cwd: process.cwd() })
        .map(dir => {
            const pkg = readPkg.sync({ cwd: dir, normalize: false });
            return {
                name: pkg.name,
                location: path.join(process.cwd(), dir),
                package: pkg
            };
        })
        .filter(pkg => !pkg.package.private && toPublish.includes(pkg.name));
};
