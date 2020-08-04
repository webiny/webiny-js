const fs = require("fs");
const path = require("path");
const { allPackages } = require("@webiny/project-utils/packages");

const projects = allPackages()
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
