const fs = require("fs");
const path = require("path");
const { green } = require("chalk");
const crypto = require("crypto");

function random(length = 32) {
    return crypto
        .randomBytes(Math.ceil(length / 2))
        .toString("hex")
        .slice(0, length);
}

const PROJECT_FOLDER = ".";

(async () => {
    console.log(`✍️  Writing environment config files...`);
    // Create root .env
    const rootEnvFilePath = path.resolve(PROJECT_FOLDER, ".env");
    const rootExampleEnvFilePath = path.resolve(PROJECT_FOLDER, "example.env");
    if (fs.existsSync(rootEnvFilePath)) {
        console.log(`⚠️  ${green(".env")} already exists, skipping.`);
    } else {
        fs.copyFileSync(rootExampleEnvFilePath, rootEnvFilePath);
        let content = fs.readFileSync(rootEnvFilePath).toString();
        content = content.replace("{REGION}", "us-east-1");
        content = content.replace("{PULUMI_CONFIG_PASSPHRASE}", random());
        fs.writeFileSync(rootEnvFilePath, content);
        console.log(`✅️ ${green(".env")} was created successfully!`);
    }

    // Create `apps/admin` .env
    const adminRoot = path.join("apps", "admin", "code");
    const exampleAdminEnvFilePath = path.resolve(PROJECT_FOLDER, adminRoot, "example.env");
    const adminEnvFilePath = path.resolve(PROJECT_FOLDER, adminRoot, ".env");

    if (fs.existsSync(adminEnvFilePath)) {
        console.log(`⚠️  ${green(path.join(adminRoot, ".env"))} already exists, skipping.`);
    } else {
        fs.copyFileSync(exampleAdminEnvFilePath, adminEnvFilePath);
        console.log(`✅️ ${green(path.join(adminRoot, ".env"))} was created successfully!`);
    }

    // Create `apps/site` .env
    const siteRoot = path.join("apps", "site", "code");
    const exampleSiteEnvFilePath = path.resolve(PROJECT_FOLDER, siteRoot, "example.env");
    const siteEnvFilePath = path.resolve(PROJECT_FOLDER, siteRoot, ".env");

    if (fs.existsSync(siteEnvFilePath)) {
        console.log(`⚠️  ${green(path.join(siteRoot, ".env"))} already exists, skipping.`);
    } else {
        fs.copyFileSync(exampleSiteEnvFilePath, siteEnvFilePath);
        console.log(`✅️ ${green(path.join(siteRoot, ".env"))} was created successfully!`);
    }
})();
