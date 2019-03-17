const path = require("path");
const { green, blue } = require("chalk");
const crypto = require("crypto");
const fs = require("fs-extra");
const glob = require("glob");
const util = require("util");
const merge = require("lodash.merge");
const loadJsonFile = require("load-json-file");
const writeJsonFile = require("write-json-file");
const globFiles = util.promisify(glob);
const { copyFile, spawnCommand } = require("../utils");
const logger = require("../logger")();

const tplJson = {
    private: true,
    workspaces: {
        packages: ["packages/*"]
    },
    dependencies: {
        "@svgr/webpack": "^4.1.0",
        "react-sortable-tree": "^2.6.0"
    },
    devDependencies: {
        "cross-env": "^5.2.0",
        prettier: "^1.15.3",
        "flow-bin": "^0.94.0"
    },
    resolutions: {
        "react-sortable-tree/**/react-dnd": "7.0.2",
        "react-sortable-tree/**/react-dnd-html5-backend": "7.0.2"
    }
};

module.exports = async () => {
    const root = process.cwd();

    logger.log(`Creating a new Webiny project in ${green(root)}...`);
    fs.ensureDirSync("packages");

    // Copy project files
    const files = ["README.md", ".gitignore", ".prettierrc.js"];
    files.forEach(file => copyFile(`init/template/${file}`, file));

    // Merge package.json
    const pkgJsonPath = path.join(root, "package.json");
    const pkgJson = await loadJsonFile(pkgJsonPath);
    merge(pkgJson, tplJson);
    await writeJsonFile(pkgJsonPath, pkgJson);

    // Setup monorepo packages
    await setupFolder("packages/admin");
    await setupApi();
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

async function setupApi() {
    const appFolder = "packages/api";
    await setupFolder(appFolder);

    const envFile = appFolder + "/.env";

    const jwtSecret = crypto
        .randomBytes(128)
        .toString("base64")
        .slice(0, 60);

    let env = fs.readFileSync(envFile, "utf-8");
    env = env.replace("MyS3cr3tK3Y", jwtSecret);
    await fs.writeFile(envFile, env);
}

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
