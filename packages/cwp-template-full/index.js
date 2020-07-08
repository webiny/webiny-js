"use strict";

const crypto = require("crypto");
const fs = require("fs-extra");
const path = require("path");
const loadJsonFile = require("load-json-file");
const writeJsonFile = require("write-json-file");
const { v4: uuidv4 } = require("uuid");
const execa = require("execa");

const s3BucketName = (projectId, appName, env) => {
    return `${projectId}-${appName.toLowerCase().replace(/_/g, "-")}-${env}`;
};

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

    //Commit .gitignore
    execa.sync("git", ["add", ".gitignore"], { cwd: root });
    execa.sync("git", ["commit", "-m", `"chore: initialize .gitignore"`], { cwd: root });

    //Update api/.env.json
    const apiEnvJson = path.join(root, "api", ".env.json");
    const apiEnv = await loadJsonFile(apiEnvJson);
    const projectId = uuidv4()
        .split("-")
        .shift();

    const jwtSecret = () =>
        crypto
            .randomBytes(128)
            .toString("base64")
            .slice(0, 60);

    apiEnv.local["JWT_SECRET"] = jwtSecret();
    apiEnv.dev["JWT_SECRET"] = jwtSecret();
    apiEnv.prod["JWT_SECRET"] = jwtSecret();
    apiEnv.local["S3_BUCKET"] = s3BucketName(projectId, appName, "local");
    apiEnv.dev["S3_BUCKET"] = s3BucketName(projectId, appName, "dev");
    apiEnv.prod["S3_BUCKET"] = s3BucketName(projectId, appName, "prod");
    await writeJsonFile(apiEnvJson, apiEnv);

    const baseEnvPath = path.join(root, ".env.json");
    const baseEnv = await loadJsonFile(baseEnvPath);
    baseEnv.local["MONGODB_NAME"] = `${appName}-local`;
    baseEnv.dev["MONGODB_NAME"] = `${appName}-dev`;
    baseEnv.prod["MONGODB_NAME"] = `${appName}-prod`;
    await writeJsonFile(baseEnvPath, baseEnv);

    let webinyRoot = fs.readFileSync(path.join(root, "webiny.root.js"), "utf-8");
    webinyRoot = webinyRoot.replace("[PROJECT_NAME]", appName);
    webinyRoot = webinyRoot.replace("[TEMPLATE_VERSION]", `${name}@${version}`);
    fs.writeFileSync(path.join(root, "webiny.root.js"), webinyRoot);

    // Save the generated projectId to a file that will be used for naming of cloud resources
    await writeJsonFile(path.join(root, ".webiny", "state", "_.json"), { id: projectId });
};
