const { join, resolve } = require("path");
const crypto = require("crypto");
const fs = require("fs-extra");
const glob = require("glob");
const util = require("util");
const execa = require("execa");
const { green } = require("chalk");
const uuid = require("uuid/v4");
const writeJsonFile = require("write-json-file");
const { trackProject } = require("@webiny/tracking");
const { version } = require(require.resolve("@webiny/cli/package.json"));
const { getSuccessBanner } = require("./gists");

const globFiles = util.promisify(glob);

function copyFile(from, to) {
    fs.copySync(join(__dirname, from), resolve(to));
}

module.exports = async ({ name }) => {
    const root = join(process.cwd(), name);

    if (fs.existsSync(root)) {
        console.log(
            `🚨 Aborting: destination folder ${green(
                name
            )} already exists! Please enter a different folder name.`
        );
        process.exit(1);
    }

    console.log(`Creating a new Webiny project in ${green(root)}...`);
    fs.ensureDirSync(root);
    process.chdir(root);

    fs.ensureDirSync("apps");
    fs.ensureDirSync("packages");

    // Copy project files
    const files = [
        "README.md",
        "example.gitignore",
        ".prettierrc.js",
        "babel.config.js",
        "package.json"
    ];
    files.forEach(file => copyFile(`template/${file}`, file));
    fs.renameSync("example.gitignore", ".gitignore");

    // Setup monorepo packages
    await setupFolder("apps");
    await setupFolder("api");
    fs.renameSync("apps/admin/example.gitignore", "apps/admin/.gitignore");
    fs.renameSync("apps/admin/example.env.json", "apps/admin/.env.json");
    fs.renameSync("apps/site/example.gitignore", "apps/site/.gitignore");
    fs.renameSync("apps/site/example.env.json", "apps/site/.env.json");
    await setupFolder("packages/theme");

    // Update config
    const jwtSecret = crypto
        .randomBytes(128)
        .toString("base64")
        .slice(0, 60);

    const envExample = resolve("api/example.env.json");
    if (fs.existsSync(envExample)) {
        fs.renameSync(envExample, "api/.env.json");
    }

    // Update .env.json
    let envFile = getFileContents("api/.env.json");
    envFile = envFile.replace("[JWT_SECRET]", jwtSecret);
    writeFileContents("api/.env.json", envFile);

    // Generate and inject project ID
    const apiId = getUniqueId();
    let apiYaml = getFileContents("api/serverless.yml");
    apiYaml = apiYaml.replace(/\[PROJECT_ID\]/g, apiId);
    writeFileContents("api/serverless.yml", apiYaml);
    writeJsonFile.sync(resolve("api/.serverless/_.json"), { id: apiId });

    let appsYaml = getFileContents("apps/serverless.yml");
    const appsId = getUniqueId();
    appsYaml = appsYaml.replace(/\[PROJECT_ID\]/g, appsId);
    writeFileContents("apps/serverless.yml", appsYaml);
    writeJsonFile.sync(resolve("apps/.serverless/_.json"), { id: appsId });

    // Install all project deps
    await execa("yarn", [], { cwd: root, stdio: "inherit" });

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
