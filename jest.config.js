const fs = require("fs");
const path = require("path");
const { allWorkspaces } = require("@webiny/project-utils/workspaces");

const projects = allWorkspaces()
    .map(pkg => {
        if (!fs.existsSync(path.join(pkg, "jest.config.js"))) {
            return null;
        }
        return pkg.replace(process.cwd() + "/", "");
    })
    .filter(Boolean);

module.exports = {
    projects,
    modulePathIgnorePatterns: ["dist"]
};
