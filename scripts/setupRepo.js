const fs = require("fs");
const path = require("path");
const { green } = require("chalk");
const crypto = require("crypto");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const uuid = require("uuid/v4");
const execa = require("execa");

/**
 * - copy example .env.json files
 * - run `build` in `serverless-files`
 */
(async () => {
    console.log(`✍️  Writing environment config files...`);
    // Create root .env.json
    const rootEnvJsonPath = path.resolve("examples", ".env.json");
    const rootExampleEnvJsonPath = path.resolve(
        "packages",
        "cli",
        "create",
        "template",
        "example.env.json"
    );
    if (fs.existsSync(rootEnvJsonPath)) {
        console.log(`⚠️  ${green("examples/.env.json")} already exists, skipping.`);
    } else {
        fs.copyFileSync(rootExampleEnvJsonPath, rootEnvJsonPath);
        console.log(`✅️ ${green("examples/.env.json")} was created successfully!`);
    }

    // Create API .env.json
    const envJsonPath = path.resolve("examples", "api", ".env.json");
    const exampleEnvJsonPath = path.resolve("examples", "api", "example.env.json");
    if (fs.existsSync(envJsonPath)) {
        console.log(`⚠️  ${green("examples/api/.env.json")} already exists, skipping.`);
    } else {
        fs.copyFileSync(exampleEnvJsonPath, envJsonPath);

        const jwtSecret = crypto
            .randomBytes(128)
            .toString("base64")
            .slice(0, 60);

        const envJson = await loadJson.sync(envJsonPath);
        envJson.default.S3_BUCKET = `webiny-js-dev-${uuid()
            .split("-")
            .shift()}`;
        envJson.default.JWT_SECRET = jwtSecret;
        await writeJson(envJsonPath, envJson);
        console.log(`✅️ ${green("examples/api/.env.json")} was created successfully!`);
    }

    // Create `admin` .env.json
    const adminEnvJsonPath = path.resolve("examples", "apps", "admin", ".env.json");
    const exampleAdminEnvJsonPath = path.resolve("examples", "apps", "admin", "example.env.json");
    if (fs.existsSync(adminEnvJsonPath)) {
        console.log(`⚠️  ${green("examples/apps/admin/.env.json")} already exists, skipping.`);
    } else {
        fs.copyFileSync(exampleAdminEnvJsonPath, adminEnvJsonPath);
        console.log(`✅️ ${green("examples/apps/admin/.env.json")} was created successfully!`);
    }

    // Create `site` .env.json
    const siteEnvJsonPath = path.resolve("examples", "apps", "site", ".env.json");
    const exampleSiteEnvJsonPath = path.resolve("examples", "apps", "site", "example.env.json");
    if (fs.existsSync(siteEnvJsonPath)) {
        console.log(`⚠️  ${green("examples/apps/site/.env.json")} already exists, skipping.`);
    } else {
        fs.copyFileSync(exampleSiteEnvJsonPath, siteEnvJsonPath);
        console.log(`✅️ ${green("examples/apps/site/.env.json")} was created successfully!`);
    }

    // Build all repo packages
    console.log(`🏗  Building packages...`);
    try {
        await execa("lerna", ["run", "build", "--stream"], {
            cwd: path.resolve("components", "serverless-files"),
            stdio: "inherit"
        });
        console.log(`✅️ Packages were built successfully!`);
    } catch (err) {
        console.log(
            `🚨 Failed to build packages: ${err.message}`
        );
    }

    // Link `@webiny/cli`
    try {
        console.log(`🔗 Linking ${green("@webiny/cli")}...`);
        // NOTE: using `npm` here as `yarn` has issues with linking binaries.
        await execa("npm", ["link"], {
            cwd: path.resolve("packages", "cli"),
            stdio: "inherit"
        });
        fs.unlinkSync(path.resolve("packages", "cli", "package-lock.json"));
    } catch (err) {
        console.log(`🚨 Failed to link ${green("@webiny/cli")} package: ${err.message}`);
        console.log(
            `📖 If you already have ${green(
                "@webiny/cli"
            )} linked or installed globally, you can ignore this. Otherwise, try linking the package manually by running ${green(
                "npm link"
            )} in the ${green("packages/cli")} folder.`
        );
    }

    console.log(`\n🏁 Your repo is almost ready!`);
    console.log(
        `Update ${green(
            "examples/api/.env.json"
        )} with your MongoDB connection string and you're ready to develop!\n`
    );
})();
