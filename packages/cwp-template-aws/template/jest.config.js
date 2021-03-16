const fs = require("fs");
const path = require("path");
const { allWorkspaces } = require("@webiny/project-utils/workspaces");
const { version } = require("@webiny/cli/package.json");

process.env.DB_TABLE_ELASTICSEARCH = "ElasticSearchStream";
process.env.WEBINY_VERSION = version;

const projects = allWorkspaces()
    .map(pkg => {
        if (!fs.existsSync(path.join(pkg, "jest.config.js"))) {
            return null;
        }
        return pkg.replace(process.cwd() + "/", "");
    })
    .filter(Boolean);

module.exports = {
    projects,
    modulePathIgnorePatterns: ["dist"]
};
