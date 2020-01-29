const { join, resolve } = require("path");
const crypto = require("crypto");
const fs = require("fs-extra");
const glob = require("glob");
const util = require("util");
const execa = require("execa");
const { green } = require("chalk");
const uuid = require("uuid/v4");
const loadJsonFile = require("load-json-file");
const ora = require("ora");
const writeJsonFile = require("write-json-file");
const { trackProject } = require("@webiny/tracking");
const { version } = require(require.resolve("@webiny/cli/package.json"));
const { getSuccessBanner } = require("./messages");
const { getPackageVersion } = require("./utils");

const globFiles = util.promisify(glob);

function copyFile(from, to) {
    fs.copySync(join(__dirname, from), resolve(to));
}

module.exports = async ({ name, tag }) => {
    const root = join(process.cwd(), name);

    if (fs.existsSync(root)) {
        console.log(
            `🚨 Aborting: destination folder ${green(
                name
            )} already exists! Please enter a different folder name.`
        );
        process.exit(1);
    }

    console.log(`📦 Creating a new Webiny project in ${green(root)}...`);
    fs.ensureDirSync(root);
    process.chdir(root);

    fs.ensureDirSync("apps");

    // Copy project files
    const files = [
        "README.md",
        "example.gitignore",
        "example.env.json",
        "webiny.js",
        ".prettierrc.js",
        "package.json"
    ];
    files.forEach(file => copyFile(`template/${file}`, file));
    fs.renameSync("example.gitignore", ".gitignore");
    fs.renameSync("example.env.json", ".env.json");

    // Setup monorepo packages
    await setupFolder("apps");
    await setupFolder("api");
    fs.renameSync("apps/admin/example.gitignore", "apps/admin/.gitignore");
    fs.renameSync("apps/admin/example.env.json", "apps/admin/.env.json");
    fs.renameSync("apps/site/example.gitignore", "apps/site/.gitignore");
    fs.renameSync("apps/site/example.env.json", "apps/site/.env.json");

    // Update config
    const jwtSecret = crypto
        .randomBytes(128)
        .toString("base64")
        .slice(0, 60);

    const envExample = resolve("api/example.env.json");
    if (fs.existsSync(envExample)) {
        fs.renameSync(envExample, "api/.env.json");
    }

    // Update API serverless.yml
    const apiId = getUniqueId();
    let apiYaml = getFileContents("api/serverless.yml");
    apiYaml = apiYaml.replace(/\[PROJECT_ID\]/g, apiId);
    writeFileContents("api/serverless.yml", apiYaml);
    writeJsonFile.sync(resolve("api/.serverless/_.json"), { id: apiId });

    // Update api/.env.json
    let apiEnvFile = getFileContents("api/.env.json");
    apiEnvFile = apiEnvFile.replace("[JWT_SECRET]", jwtSecret);
    apiEnvFile = apiEnvFile.replace("[BUCKET]", `webiny-files-${apiId}`);
    writeFileContents("api/.env.json", apiEnvFile);

    // Update .env.json
    let envFile = getFileContents(".env.json");
    envFile = envFile.replace("[DATABASE]", `webiny-${apiId}`);
    writeFileContents(".env.json", envFile);

    // Update apps serverless.yml
    let appsYaml = getFileContents("apps/serverless.yml");
    const appsId = getUniqueId();
    appsYaml = appsYaml.replace(/\[PROJECT_ID\]/g, appsId);
    writeFileContents("apps/serverless.yml", appsYaml);
    writeJsonFile.sync(resolve("apps/.serverless/_.json"), { id: appsId });

    // Inject the exact package version numbers based on the tag
    let spinner = ora(`Loading Webiny package versions...`).start();

    const jsons = [
        resolve("package.json"),
        resolve("apps/admin/package.json"),
        resolve("apps/site/package.json")
    ];

    await Promise.all(
        jsons.map(async jsonPath => {
            const json = await loadJsonFile(jsonPath);
            const keys = Object.keys(json.dependencies);
            await Promise.all(
                keys.map(async name => {
                    if (json.dependencies[name] === "latest") {
                        json.dependencies[name] = `^` + (await getPackageVersion(name, tag));
                    }
                })
            );
            await writeJsonFile(jsonPath, json);
        })
    );

    spinner.succeed(`Finished loading package versions`);

    spinner = ora("Installing dependencies...").start();
    // Install all project deps
    await execa("yarn", [], { cwd: root });
    spinner.succeed(`All dependencies installed successfully!`);

    await trackProject({ cliVersion: version });

    console.log(await getSuccessBanner());
};

async function setupFolder(appFolder) {
    // copy custom files and override CRA config
    const files = await globFiles("**/*", {
        cwd: join(__dirname, "template", appFolder),
        nodir: true,
        dot: true
    });
    files.forEach(file => copyFile(`template/${appFolder}/${file}`, `${appFolder}/${file}`));
}

const getUniqueId = () => {
    return uuid()
        .split("-")
        .shift();
};

const getFileContents = file => {
    return fs.readFileSync(resolve(file), "utf-8");
};

const writeFileContents = (file, contents) => {
    fs.writeFileSync(resolve(file), contents);
};
