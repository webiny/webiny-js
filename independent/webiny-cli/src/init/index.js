const path = require("path");
const { green, blue } = require("chalk");
const fs = require("fs-extra");
const glob = require("glob");
const util = require("util");
const globFiles = util.promisify(glob);
const { copyFile, spawnCommand } = require("../utils");
const logger = require("../logger")();

module.exports = async () => {
    const root = process.cwd();

    logger.log(`Creating a new Webiny project in ${green(root)}...`);
    fs.ensureDirSync("packages");

    // Copy project files
    const files = ["package.json", "README.md", ".gitignore", ".prettierrc.js", "babel.config.js"];
    files.forEach(file => copyFile(`init/template/${file}`, file));

    await setupFolder("packages/admin");
    await setupFolder("packages/api");
    await setupFolder("packages/site");
    await setupFolder("packages/theme");
    await setupFolder("packages/webiny-rewire");

    await spawnCommand("yarn", [], { cwd: root });

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

async function setupFolder(appFolder) {
    // copy custom files and override CRA config
    const files = await globFiles("**/*", {
        cwd: path.join(__dirname, "template", appFolder),
        nodir: true,
        dot: true
    });

    files.forEach(file => copyFile(`init/template/${appFolder}/${file}`, `${appFolder}/${file}`));

    const envExample = path.join(appFolder + "/.env.example");
    if (fs.existsSync(envExample)) {
        fs.renameSync(envExample, appFolder + "/.env");
    }
}
