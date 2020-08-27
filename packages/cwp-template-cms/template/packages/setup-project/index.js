//used to run a quick project setup for developers
//cwp-template-cms/packages/setup-project/index.js
const fs = require("fs");
const path = require("path");
const { green } = require("chalk");
const crypto = require("crypto");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const { v4: uuidv4 } = require("uuid");
const execa = require("execa");

const s3BucketName = (projectId, appName, env) => {
    return `${projectId}-${appName.toLowerCase().replace(/_/g, "-")}-${env}`;
};

(async () => {
    const root = process.cwd();
    const webinyConfig = require(path.join(root, "webiny.root.js"));
    const appName = webinyConfig.projectName;
    const projectId = uuidv4()
        .split("-")
        .shift();

    console.log(`✍️  Writing environment config files...`);
    // Create root .env.json
    const rootEnvJsonPath = path.join(root, ".env.json");
    const rootExampleEnvJsonPath = path.join(root, "example.env.json");
    if (fs.existsSync(rootEnvJsonPath)) {
        console.log(`⚠️  ${green(".env.json")} already exists, skipping.`);
    } else {
        fs.copyFileSync(rootExampleEnvJsonPath, rootEnvJsonPath);
        const baseEnv = await loadJson(rootEnvJsonPath);
        baseEnv.local["MONGODB_NAME"] = `${appName}-local`;
        baseEnv.dev["MONGODB_NAME"] = `${appName}-dev`;
        baseEnv.prod["MONGODB_NAME"] = `${appName}-prod`;
        await writeJson(rootEnvJsonPath, baseEnv);
        console.log(`✅️ ${green(".env.json")} was created successfully!`);
    }

    // Create API .env.json
    const envJsonPath = path.join(root, "api", ".env.json");
    const exampleEnvJsonPath = path.join(root, "api", "example.env.json");
    if (fs.existsSync(envJsonPath)) {
        console.log(`⚠️  ${green("api/.env.json")} already exists, skipping.`);
    } else {
        fs.copyFileSync(exampleEnvJsonPath, envJsonPath);

        const apiEnvJson = path.join(root, "api", ".env.json");
        const apiEnv = await loadJson(apiEnvJson);

        const jwtSecret = () =>
            crypto
                .randomBytes(128)
                .toString("base64")
                .slice(0, 60);

        apiEnv.local["JWT_SECRET"] = jwtSecret();
        apiEnv.local["S3_BUCKET"] = s3BucketName(projectId, appName, "local");
        apiEnv.dev["JWT_SECRET"] = jwtSecret();
        apiEnv.dev["S3_BUCKET"] = s3BucketName(projectId, appName, "dev");
        apiEnv.prod["JWT_SECRET"] = jwtSecret();
        apiEnv.prod["S3_BUCKET"] = s3BucketName(projectId, appName, "prod");
        await writeJson(apiEnvJson, apiEnv);
        console.log(`✅️ ${green("api/.env.json")} was created successfully!`);
    }

    // Create `apps/admin` .env.json
    const adminEnvJsonPath = path.join(root, "apps", "admin", ".env.json");
    const exampleAdminEnvJsonPath = path.join(root, "admin", "example.env.json");
    if (fs.existsSync(adminEnvJsonPath)) {
        console.log(`⚠️  ${green("apps/admin/.env.json")} already exists, skipping.`);
    } else {
        fs.copyFileSync(exampleAdminEnvJsonPath, adminEnvJsonPath);
        console.log(`✅️ ${green("apps/admin/.env.json")} was created successfully!`);
    }

    // Save the generated projectId to a file that will be used for naming of cloud resources
    await writeJson(path.join(root, ".webiny", "state", "_.json"), { id: projectId });

    // Build all repo packages
    console.log(`🏗  Building packages...`);
    try {
        await execa("lerna", ["run", "build", "--stream"], {
            stdio: "inherit"
        });
        console.log(`✅️ Packages were built successfully!`);
    } catch (err) {
        console.log(`🚨 Failed to build packages: ${err.message}`);
    }

    console.log(`\n🏁 Your repo is almost ready!`);
    console.log(
        `Update ${green(
            ".env.json"
        )} with your MongoDB connection string and you're ready to develop!\n`
    );
})();
