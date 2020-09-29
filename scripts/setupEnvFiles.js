const fs = require("fs");
const path = require("path");
const { green } = require("chalk");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const crypto = require("crypto");

function random(length = 5) {
    return crypto
        .randomBytes(Math.ceil(length / 2))
        .toString("hex")
        .slice(0, length);
}

const PROJECT_FOLDER = ".";

(async () => {
    console.log(`✍️  Writing environment config files...`);
    // Create root .env.json
    const rootEnvJsonPath = path.resolve(PROJECT_FOLDER, ".env.json");
    const rootExampleEnvJsonPath = path.resolve(PROJECT_FOLDER, "example.env.json");
    if (fs.existsSync(rootEnvJsonPath)) {
        console.log(`⚠️  ${green(".env.json")} already exists, skipping.`);
    } else {
        fs.copyFileSync(rootExampleEnvJsonPath, rootEnvJsonPath);

        const rootEnvJson = await loadJson.sync(rootEnvJsonPath);
        rootEnvJson.default.PULUMI_CONFIG_PASSPHRASE = random();
        await writeJson(rootEnvJsonPath, rootEnvJson);

        console.log(`✅️ ${green(".env.json")} was created successfully!`);
    }

    // Create API .env.json
    const exampleEnvJsonPath = path.resolve(PROJECT_FOLDER, "api", "example.env.json");
    const envJsonPath = path.resolve(PROJECT_FOLDER, "api", ".env.json");
    if (fs.existsSync(envJsonPath)) {
        console.log(`⚠️  ${green("api/.env.json")} already exists, skipping.`);
    } else {
        fs.copyFileSync(exampleEnvJsonPath, envJsonPath);

        const envJson = await loadJson.sync(envJsonPath);
        envJson.default.S3_BUCKET = `webiny-${random()
            .split("-")
            .shift()}`;

        envJson.local.DOCUMENT_DB_USERNAME = `user${random()}`;
        envJson.local.DOCUMENT_DB_PASSWORD = random(32);
        envJson.local.DOCUMENT_DB_DATABASE = `webiny-${random()}`;

        await writeJson(envJsonPath, envJson);
        console.log(`✅️ ${green("api/.env.json")} was created successfully!`);
    }

    // Create `admin` .env.json
    const adminRoot = path.join("apps", "admin", "code");
    const exampleAdminEnvJsonPath = path.resolve(PROJECT_FOLDER, adminRoot, "example.env.json");
    const adminEnvJsonPath = path.resolve(PROJECT_FOLDER, adminRoot, ".env.json");

    if (fs.existsSync(adminEnvJsonPath)) {
        console.log(`⚠️  ${green(path.join(adminRoot, ".env.json"))} already exists, skipping.`);
    } else {
        fs.copyFileSync(exampleAdminEnvJsonPath, adminEnvJsonPath);
        console.log(`✅️ ${green(path.join(adminRoot, ".env.json"))} was created successfully!`);
    }

    // Create `site` .env.json
    const siteRoot = path.join("apps", "site", "code");
    const exampleSiteEnvJsonPath = path.resolve(PROJECT_FOLDER, siteRoot, "example.env.json");
    const siteEnvJsonPath = path.resolve(PROJECT_FOLDER, siteRoot, ".env.json");

    if (fs.existsSync(siteEnvJsonPath)) {
        console.log(`⚠️  ${green(path.join(siteRoot, ".env.json"))} already exists, skipping.`);
    } else {
        fs.copyFileSync(exampleSiteEnvJsonPath, siteEnvJsonPath);
        console.log(`✅️ ${green(path.join(siteRoot, ".env.json"))} was created successfully!`);
    }
})();
