const fs = require("fs-extra");
const path = require("path");
const execa = require("execa");
const crypto = require("crypto");

function random(length = 32) {
    return crypto
        .randomBytes(Math.ceil(length / 2))
        .toString("hex")
        .slice(0, length);
}

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

    const rootEnvFilePath = path.join(root, ".env");
    let content = fs.readFileSync(rootEnvFilePath).toString();
    content = content.replace("{REGION}", "us-east-1");
    content = content.replace("{PULUMI_CONFIG_PASSPHRASE}", random());
    fs.writeFileSync(rootEnvFilePath, content);

    let webinyRoot = fs.readFileSync(path.join(root, "webiny.root.js"), "utf-8");
    webinyRoot = webinyRoot.replace("[PROJECT_NAME]", appName);
    webinyRoot = webinyRoot.replace("[TEMPLATE_VERSION]", `${name}@${version}`);
    fs.writeFileSync(path.join(root, "webiny.root.js"), webinyRoot);
};
