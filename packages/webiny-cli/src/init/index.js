const path = require("path");
const crypto = require("crypto");
const fs = require("fs-extra");
const glob = require("glob");
const util = require("util");
const execa = require("execa");
const merge = require("lodash.merge");
const { green, blue } = require("chalk");
const loadJsonFile = require("load-json-file");
const writeJsonFile = require("write-json-file");
const globFiles = util.promisify(glob);
const logger = require("../logger")();

function copyFile(from, to) {
    fs.copySync(path.join(__dirname, from), path.resolve(to));
}

const tplJson = {
    private: true,
    workspaces: {
        packages: ["packages/*"]
    },
    devDependencies: {
        prettier: "^1.15.3",
        "flow-bin": "^0.94.0"
    }
};

module.exports = async () => {
    const root = process.cwd();

    logger.log(`Creating a new Webiny project in ${green(root)}...`);

    const pkgJsonPath = path.resolve("package.json");
    let pkgJson;
    try {
        pkgJson = await loadJsonFile(pkgJsonPath);
    } catch (e) {
        logger.error(
            "%s file does not exist! Make sure you initialize your project using %s first.",
            "package.json",
            "yarn init"
        );
        process.exit(1);
    }

    fs.ensureDirSync("packages");

    // Copy project files
    const files = [
        "README.md",
        ".gitignore",
        ".prettierrc.js",
        ".env.example",
        "webiny.config.js",
        "babel.config.js"
    ];
    files.forEach(file => copyFile(`template/${file}`, file));

    // Update config
    const envFile = path.resolve(".env");

    const jwtSecret = crypto
        .randomBytes(128)
        .toString("base64")
        .slice(0, 60);

    const envExample = path.resolve(".env.example");
    if (fs.existsSync(envExample)) {
        fs.renameSync(envExample, ".env");
    }

    let env = fs.readFileSync(envFile, "utf-8");
    env = env.replace("MyS3cr3tK3Y", jwtSecret);
    await fs.writeFile(envFile, env);

    // Merge package.json
    merge(pkgJson, tplJson);
    await writeJsonFile(pkgJsonPath, pkgJson);

    // Setup monorepo packages
    await setupFolder("packages/admin");
    await setupFolder("packages/api");
    await setupFolder("packages/site");
    await setupFolder("packages/theme");
    await setupFolder("packages/webiny-rewire");

    await execa("yarn", [], { cwd: root, stdio: "inherit" });

    console.log();
    logger.info("Your Webiny project is almost ready...\n");
    console.log(
        `1) Configure a MongoDB database and update connection parameters in ${blue(".env")}`
    );
    console.log(`2) To finish the installation: ${blue("webiny install-functions")}`);
    console.log(`3) Run API: ${blue("webiny start-functions")}`);
    console.log(`4) Run Admin app: ${blue("webiny start-app admin")}`);
    console.log(`5) Run Site app: ${blue("webiny start-app site")}\n`);
    logger.info("There is also a convenience alias 'wby' (for 'webiny') to type even less :)\n");

    logger.success(
        `That's it! Now you have your API, admin and site apps up and running!\n  Happy coding :)`
    );
};

async function setupFolder(appFolder) {
    // copy custom files and override CRA config
    const files = await globFiles("**/*", {
        cwd: path.join(__dirname, "template", appFolder),
        nodir: true,
        dot: true
    });

    files.forEach(file => copyFile(`template/${appFolder}/${file}`, `${appFolder}/${file}`));
}
