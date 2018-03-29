const globby = require("globby");
const fs = require("fs-extra");
const path = require("path");

const packages = {
    "webiny-api": "../../packages",
    "webiny-api-security": "../../packages",
    "webiny-compose": "../../packages",
    "webiny-data-extractor": "../../packages",
    "webiny-entity": "../../packages",
    "webiny-entity-mysql": "../../packages",
    "webiny-file-storage": "../../packages",
    "webiny-file-storage-local": "../../packages",
    "webiny-jimp": "../../packages",
    "webiny-model": "../../packages",
    "webiny-mysql-connection": "../../packages",
    "webiny-service-manager": "../../packages",
    "webiny-sql-table": "../../packages",
    "webiny-sql-table-mysql": "../../packages",
    "webiny-sql-table-sync": "../../packages",
    "webiny-validation": "../../packages"
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
