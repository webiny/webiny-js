const path = require("path");
const fs = require("fs-extra");
const getPackages = require("get-yarn-workspaces");

// Find all Webiny apps in the project (packages containing .webiny file)
module.exports = () =>
    getPackages(process.cwd())
        .filter(pkg => fs.existsSync(pkg + "/.webiny"))
        .map(root => {
            const json = JSON.parse(fs.readFileSync(path.join(root, "/.webiny"), "utf8"));
            if (json.type !== "function") {
                return null;
            }
            json.handler = "/src/handler.js";
            json.root = root;
            json.package = JSON.parse(fs.readFileSync(path.join(root, "/package.json"), "utf8"));
            return json;
        })
        .filter(Boolean);
