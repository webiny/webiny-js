const fs = require("fs");
const { linkWorkspaces } = require("./linkWorkspaces");

const isFolder = p => fs.statSync(p).isDirectory();

const allWorkspaces = () => {
    const path = require("path");
    return require("get-yarn-workspaces")()
        .filter(isFolder)
        .map(pkg => pkg.replace(/\//g, path.sep));
};

module.exports = { allWorkspaces, linkWorkspaces };
