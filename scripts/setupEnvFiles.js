import fs from "fs";
import path from "path";
import chalk from "chalk";

const { green } = chalk;
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
        fs.writeFileSync(rootEnvFilePath, content);
        console.log(`✅️ ${green(".env")} was created successfully!`);
    }
})();
