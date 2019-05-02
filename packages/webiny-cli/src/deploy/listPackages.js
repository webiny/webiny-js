const path = require("path");
const fs = require("fs-extra");
const getWorkspaces = require("get-yarn-workspaces");
const getConfig = require("../utils/getConfig");

// Find all Webiny functions in the project
module.exports = async () => {
    const {
        config: { apps = {}, functions = {} }
    } = await getConfig();
    const workspaces = getWorkspaces(process.cwd()).map(pkg => pkg.replace(/\//g, path.sep));

    const packages = [];

    Object.keys(functions || [])
        .map(name => {
            const root = workspaces.find(folder => path.basename(folder) === name);
            if (!root) {
                return null;
            }

            return {
                handler: "src/handler.js",
                ...functions[name],
                root,
                package: JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"))
            };
        })
        .filter(Boolean)
        .map(pkg => packages.push(pkg));
};
