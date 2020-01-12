const path = require("path");

module.exports = require("get-yarn-workspaces")().map(pkg => pkg.replace(/\//g, path.sep));
