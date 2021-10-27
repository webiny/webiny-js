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

/**
 * A simple scripts that just creates needed environment files. Right now it just creates a singe ".env" file
 * in project root, but if needed, feel free to add additional code.
 * Note that this script will be executed in the "setupRepo.js" script, as its first step.
 */
(async () => {
    console.log(`✍️  Writing environment config files...`);
    // Create root .env
    const rootEnvFilePath = path.resolve(PROJECT_FOLDER, ".env");
    const rootExampleEnvFilePath = path.resolve(PROJECT_FOLDER, ".example.env");
    if (fs.existsSync(rootEnvFilePath)) {
        console.log(`⚠️  ${green(".env")} already exists, skipping.`);
    } else {
        fs.copyFileSync(rootExampleEnvFilePath, rootEnvFilePath);
        let content = fs.readFileSync(rootEnvFilePath).toString();
        content = content.replace("{REGION}", "us-east-1");
        content = content.replace("{PULUMI_CONFIG_PASSPHRASE}", random());
        content = content.replace("{PULUMI_SECRETS_PROVIDER}", "passphrase");
        fs.writeFileSync(rootEnvFilePath, content);
        console.log(`✅️ ${green(".env")} was created successfully!`);
    }
})();
