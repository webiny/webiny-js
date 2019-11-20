const path = require("path");

module.exports = require("get-yarn-workspaces")().map(pkg => path.replace(/\//, path.sep));
