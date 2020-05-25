"use strict";

const crypto = require("crypto");
const fs = require("fs-extra");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

module.exports = ({ appName, root }) => {
    const filesToCopy = require("./filesToCopy");
    for (let i = 0; i < filesToCopy.length; i++) {
        if (!fs.existsSync(path.join(root, filesToCopy[i].dir, filesToCopy[i].newFile))) {
            fs.moveSync(
                path.join(root, filesToCopy[i].dir, filesToCopy[i].oldFile),
                path.join(root, filesToCopy[i].dir, filesToCopy[i].newFile),
                []
            );
        }
    }

    //Update api/.env.json
    let apiEnv = fs.readFileSync(path.join(root, "api", ".env.json"), "utf-8");
    const projectId = uuidv4()
        .split("-")
        .shift();

    const jwtSecret = crypto
        .randomBytes(128)
        .toString("base64")
        .slice(0, 60);

    apiEnv = apiEnv.replace("[JWT_SECRET]", jwtSecret);
    apiEnv = apiEnv.replace("[BUCKET]", `${projectId}-${appName}-files`);
    fs.writeFileSync(path.join(root, "api", ".env.json"), apiEnv);

    const baseEnvPath = require(path.join(root, ".env.json"));
    const baseEnv = require(baseEnvPath);
    baseEnv.default["MONGODB_NAME"] = appName;
    fs.writeFileSync(baseEnvPath, JSON.stringify(baseEnv, null, 2));

    let webinyRoot = fs.readFileSync(path.join(root, "webiny.root.js"), "utf-8");
    webinyRoot = webinyRoot.replace("webiny-js", appName);
    fs.writeFileSync(path.join(root, "webiny.root.js"), webinyRoot);
};
