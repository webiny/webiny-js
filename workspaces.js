const getWs = require("get-yarn-workspaces");

console.log(getWs().filter(dir => dir.includes("/addons/")));