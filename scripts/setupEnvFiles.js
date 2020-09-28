const fs = require("fs");
const path = require("path");
const { green } = require("chalk");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const uniqid = require("uniqid");

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
        rootEnvJson.default.PULUMI_CONFIG_PASSPHRASE = uniqid() + uniqid();
        await writeJson(rootEnvJsonPath, rootEnvJson);

        console.log(`✅️ ${green(".env.json")} was created successfully!`);
    }

    // Create API .env.json
    const envJsonPath = path.resolve(PROJECT_FOLDER, "api", ".env.json");
    const exampleEnvJsonPath = path.resolve(PROJECT_FOLDER, "api", "example.env.json");
    if (fs.existsSync(envJsonPath)) {
        console.log(`⚠️  ${green("api/.env.json")} already exists, skipping.`);
    } else {
        fs.copyFileSync(exampleEnvJsonPath, envJsonPath);

        const envJson = await loadJson.sync(envJsonPath);
        envJson.default.S3_BUCKET = `webiny-${uniqid()
            .split("-")
            .shift()}`;

        envJson.local.DOCUMENT_DB_USERNAME = uniqid() + uniqid();
        envJson.local.DOCUMENT_DB_PASSWORD = uniqid() + uniqid();
        envJson.local.DOCUMENT_DB_DATABASE = "webiny-" + uniqid();

        await writeJson(envJsonPath, envJson);
        console.log(`✅️ ${green("api/.env.json")} was created successfully!`);
    }

    // Create `admin` .env.json
    const adminEnvJsonPath = path.resolve(PROJECT_FOLDER, "apps", "admin", "code", ".env.json");
    const exampleAdminEnvJsonPath = path.resolve(
        PROJECT_FOLDER,
        "apps",
        "admin",
        "code",
        "example.env.json"
    );

    if (fs.existsSync(adminEnvJsonPath)) {
        console.log(`⚠️  ${green("apps/admin/code/.env.json")} already exists, skipping.`);
    } else {
        fs.copyFileSync(exampleAdminEnvJsonPath, adminEnvJsonPath);
        console.log(`✅️ ${green("apps/admin/code/.env.json")} was created successfully!`);
    }

    // Create `site` .env.json
    const siteEnvJsonPath = path.resolve(
        PROJECT_FOLDER,
        "apps",
        "site",
        "code",
        ".env.json"
    );
    const exampleSiteEnvJsonPath = path.resolve(PROJECT_FOLDER, "apps", "site", "code", "example.env.json");
    if (fs.existsSync(siteEnvJsonPath)) {
        console.log(`⚠️  ${green("apps/site/code/.env.json")} already exists, skipping.`);
    } else {
        fs.copyFileSync(exampleSiteEnvJsonPath, siteEnvJsonPath);
        console.log(`✅️ ${green("apps/site/code/.env.json")} was created successfully!`);
    }
})();
