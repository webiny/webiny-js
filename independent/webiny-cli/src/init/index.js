const path = require("path");
const { green, blue } = require("chalk");
const fs = require("fs-extra");
const glob = require("glob");
const util = require("util");
const del = require("del");
const readPkg = require("read-pkg");
const writePkg = require("write-pkg");
const globFiles = util.promisify(glob);
const { addPackages, copyFile, createReactApp, spawnCommand } = require("../utils");
const logger = require("../logger")();

module.exports = async () => {
    const root = process.cwd();

    logger.log(`Creating a new Webiny project in ${green(root)}...`);
    fs.ensureDirSync("packages");

    // Copy project files
    const files = ["package.json", "README.md", ".gitignore", ".prettierrc.js", "babel.config.js"];
    files.forEach(file => copyFile(`init/template/${file}`, file));

    await setupWebinyRewire();
    await setupTheme();
    await setupAdmin();
    await setupApi();
    await setupSite();

    console.log();
    logger.info("Your Webiny project is almost ready...\n");
    console.log(
        `1) Configure a MongoDB database and update connection parameters in ${blue(
            "packages/api/.env"
        )}`
    );
    console.log(`2) To finish the installation: ${blue("cd packages/api && yarn setup")}`);
    console.log(`3) Run API: ${blue("cd packages/api && yarn start")}`);
    console.log(`4) Run Admin app: ${blue("cd packages/admin && yarn start")}`);
    console.log(`5) Run Site app: ${blue("cd packages/site && yarn start")}\n`);

    logger.success(
        `That's it! Now you have your API, admin and site apps up and running!\n   Happy coding :)`
    );
};

async function setupAdmin() {
    const appFolder = "packages/admin";

    logger.log("Creating admin app...");
    await createReactApp(appFolder);

    await del([`${appFolder}/public`]);

    // copy custom files and override CRA config
    const files = await globFiles("**/*", {
        cwd: path.join(__dirname, "template", appFolder),
        nodir: true,
        dot: true
    });

    files.forEach(file => copyFile(`init/template/${appFolder}/${file}`, `${appFolder}/${file}`));

    logger.log("Adding Webiny to CRA setup...");

    // Install webiny admin deps
    await addPackages(appFolder, [
        "apollo-link-batch-http@1.2.4",
        "mutation-observer@^1.0.3",
        "node-sass@4.9.3",
        "@rescripts/cli@^0.0.7",
        "react-hot-loader@4.3.5",
        "webiny-app@^1",
        "webiny-admin@^1",
        "webiny-app-cms@^1",
        "webiny-app-security@^1",
        "webiny-integration-cookie-policy@^1",
        "webiny-integration-google-tag-manager@^1",
        "webiny-integration-typeform@^1",
        "webiny-integration-mailchimp@^1",
        "webiny-ui@^1"
    ]);

    // Update package.json
    const packageJson = readPkg.sync({ cwd: appFolder, normalize: false });
    packageJson.scripts.start = "cross-env PUBLIC_URL=/admin rescripts start";
    packageJson.scripts.build = "cross-env PUBLIC_URL=/admin rescripts build";
    packageJson.scripts.test = "rescripts test --env=jsdom";
    packageJson.svgo = { plugins: { removeViewBox: false } };
    writePkg.sync("packages/admin/package.json", packageJson);

    fs.renameSync(appFolder + "/.env.example", appFolder + "/.env");
}

async function setupSite() {
    const appFolder = "packages/site";
    logger.log("Creating site app...");
    await createReactApp("packages/site");
    // TODO: copy custom files and override CRA config
    // TODO: rename `.env.example`
    // fs.renameSync(appFolder + "/.env.example", appFolder + "/.env");
}

async function setupTheme() {
    logger.log("Creating theme...");
    const appFolder = "packages/theme";

    // copy custom files and override CRA config
    const files = await globFiles("**/*", {
        cwd: path.join(__dirname, "template", appFolder),
        nodir: true,
        dot: true
    });

    files.forEach(file => copyFile(`init/template/${appFolder}/${file}`, `${appFolder}/${file}`));
    await spawnCommand("yarn", [], { cwd: path.resolve(appFolder) });
}

async function setupWebinyRewire() {
    const appFolder = "packages/webiny-rewire";

    // copy custom files and override CRA config
    const files = await globFiles("**/*", {
        cwd: path.join(__dirname, "template", appFolder),
        nodir: true,
        dot: true
    });

    files.forEach(file => copyFile(`init/template/${appFolder}/${file}`, `${appFolder}/${file}`));

    await spawnCommand("yarn", [], { cwd: path.resolve(appFolder) });
}

async function setupApi() {
    logger.log("Creating API...");
    const appFolder = "packages/api";

    // copy custom files and override CRA config
    const files = await globFiles("**/*", {
        cwd: path.join(__dirname, "template", appFolder),
        nodir: true,
        dot: true
    });

    files.forEach(file => copyFile(`init/template/${appFolder}/${file}`, `${appFolder}/${file}`));

    await spawnCommand("yarn", [], { cwd: path.resolve(appFolder) });

    fs.renameSync(appFolder + "/.env.example", appFolder + "/.env");
}
