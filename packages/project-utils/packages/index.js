const { linkPackages } = require("./linkPackages");

const allPackages = () => {
    const path = require("path");
    return require("get-yarn-workspaces")().map(pkg => pkg.replace(/\//g, path.sep));
};

module.exports = { allPackages, linkPackages };
