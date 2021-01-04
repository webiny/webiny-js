"use strict";

const fs = require("fs-extra");
const path = require("path");
const execa = require("execa");

module.exports = async ({ appName, root }) => {
    const { name, version } = require("./package.json");
    const filesToCopy = require("./filesToCopy");
    for (let i = 0; i < filesToCopy.length; i++) {
        fs.moveSync(
            path.join(root, filesToCopy[i].dir, filesToCopy[i].oldFile),
            path.join(root, filesToCopy[i].dir, filesToCopy[i].newFile),
            { overwrite: true }
        );
    }

    // Commit .gitignore.
    execa.sync("git", ["add", ".gitignore"], { cwd: root });
    execa.sync("git", ["commit", "-m", `chore: initialize .gitignore`], { cwd: root });

    let webinyRoot = fs.readFileSync(path.join(root, "webiny.root.js"), "utf-8");
    webinyRoot = webinyRoot.replace("[PROJECT_NAME]", appName);
    webinyRoot = webinyRoot.replace("[TEMPLATE_VERSION]", `${name}@${version}`);
    fs.writeFileSync(path.join(root, "webiny.root.js"), webinyRoot);
};
