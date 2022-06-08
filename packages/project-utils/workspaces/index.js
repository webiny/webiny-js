const fs = require("fs");
const { linkWorkspaces } = require("./linkWorkspaces");

const hasPackageJson = p => fs.existsSync(p + "/package.json");

const allWorkspaces = () => {
    const path = require("path");
    return require("get-yarn-workspaces")()
        .filter(hasPackageJson)
        .map(pkg => pkg.replace(/\//g, path.sep));
};

module.exports = { allWorkspaces, linkWorkspaces };
