const path = require("path");
const fs = require("fs-extra");
const getWorkspaces = require("get-yarn-workspaces");
const getConfig = require("./getConfig");

let packages = null;

// Find all Webiny apps and functions in the project
module.exports = async (type = null) => {
    if (packages) {
        return type ? packages.filter(p => p.type === type) : packages;
    }

    packages = [];

    const {
        config: { apps = {}, functions = {} }
    } = await getConfig();

    const workspaces = getWorkspaces(process.cwd()).map(pkg => pkg.replace(/\//g, path.sep));

    Object.keys(functions || []).forEach(name => {
        const root = workspaces.find(folder => path.basename(folder) === name);
        if (!root) {
            return;
        }

        packages.push({
            name,
            type: "function",
            handler: "src/handler.js",
            ...functions[name],
            root,
            package: JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"))
        });
    });

    Object.keys(apps || []).forEach(name => {
        const root = workspaces.find(folder => path.basename(folder) === name);
        if (!root) {
            return;
        }

        packages.push({
            name,
            type: "app",
            ...apps[name],
            root,
            package: JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"))
        });
    });

    return type ? packages.filter(p => p.type === type) : packages;
};
