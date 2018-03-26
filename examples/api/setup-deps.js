const globby = require("globby");
const fs = require("fs-extra");
const path = require("path");

const packages = {
    "webiny-api": "../../packages-api",
    "webiny-api-security": "../../packages-api",
    "webiny-compose": "../../packages-utils",
    "webiny-data-extractor": "../../packages-utils",
    "webiny-entity": "../../packages-utils",
    "webiny-entity-mysql": "../../packages-utils",
    "webiny-file-storage": "../../packages-utils",
    "webiny-file-storage-local": "../../packages-utils",
    "webiny-jimp": "../../packages-utils",
    "webiny-model": "../../packages-utils",
    "webiny-mysql-connection": "../../packages-utils",
    "webiny-service-manager": "../../packages-utils",
    "webiny-sql-table": "../../packages-utils",
    "webiny-sql-table-mysql": "../../packages-utils",
    "webiny-sql-table-sync": "../../packages-utils",
    "webiny-validation": "../../packages-utils"
};

Object.keys(packages).forEach(name => {
    const folder = packages[name];
    const source = process.cwd() + "/" + folder + "/" + name;
    const paths = globby.sync([
        source + "/lib/**/*.js",
        source + "/package.json",
        "!" + name + "/{src, test}/**"
    ]);

    paths.map(p => {
        fs.copySync(p, path.join(process.cwd(), "node_modules", name, p.split(name).pop()));
    });

    // TODO: update package.json main field with "lib/index.js"
    // NOTE: this is only temporary until we publish actual packages to npm
});
