const fs = require("fs");
const { linkWorkspaces } = require("./linkWorkspaces");

const hasPackageJson = p => fs.existsSync(p + "/package.json");

const allWorkspaces = () => {
    const { getProject } = require("@webiny/cli/utils");
    const projectPackageJson = require(getProject().root + "/package.json");
    if (!Array.isArray(projectPackageJson.workspaces)) {
        return [];
    }

    const path = require("path");
    return require("get-yarn-workspaces")()
        .filter(hasPackageJson)
        .map(pkg => pkg.replace(/\//g, path.sep));
};

module.exports = { allWorkspaces, linkWorkspaces };
