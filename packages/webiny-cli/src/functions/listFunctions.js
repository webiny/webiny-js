const path = require("path");
const fs = require("fs-extra");
const getPackages = require("get-yarn-workspaces");
const getConfig = require("./getConfig");

// Find all Webiny functions in the project
module.exports = async () => {
    const { functions } = await getConfig();
    const packages = getPackages(process.cwd()).map(pkg => pkg.replace(/\//g, path.sep));

    return Object.keys(functions || [])
        .map(name => {
            const root = packages.find(folder => path.basename(folder) === name);
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
        .filter(Boolean);
};
