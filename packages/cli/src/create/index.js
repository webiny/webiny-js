const { join, resolve } = require("path");
const crypto = require("crypto");
const fs = require("fs-extra");
const glob = require("glob");
const util = require("util");
const execa = require("execa");
const { green } = require("chalk");
const { trackProject } = require("@webiny/tracking");
const { version } = require(require.resolve("@webiny/cli/package.json"));
const { getSuccessBanner } = require("./gists");

const globFiles = util.promisify(glob);

function copyFile(from, to) {
    fs.copySync(join(__dirname, from), resolve(to));
}

module.exports = async ({ name }) => {
    const root = join(process.cwd(), name);

    console.log(`Creating a new Webiny project in ${green(root)}...`);
    fs.ensureDirSync(root);
    process.chdir(root);

    fs.ensureDirSync("apps");
    fs.ensureDirSync("packages");

    // Copy project files
    const files = [
        "README.md",
        "example.gitignore",
        "example.env.api.js",
        ".prettierrc.js",
        "babel.config.js",
        "serverless.api.yml",
        "serverless.apps.yml",
        "package.json"
    ];
    files.forEach(file => copyFile(`template/${file}`, file));
    fs.renameSync("example.gitignore", ".gitignore");

    // Setup monorepo packages
    await setupFolder("apps");
    fs.renameSync("apps/admin/example.gitignore", "apps/admin/.gitignore");
    fs.renameSync("apps/admin/example.env.js", "apps/admin/.env.js");
    fs.renameSync("apps/site/example.gitignore", "apps/site/.gitignore");
    fs.renameSync("apps/site/example.env.js", "apps/site/.env.js");
    await setupFolder("packages/theme");

    // Update config
    const jwtSecret = crypto
        .randomBytes(128)
        .toString("base64")
        .slice(0, 60);

    const envExample = resolve("example.env.api.js");
    if (fs.existsSync(envExample)) {
        fs.renameSync(envExample, ".env.api.js");
    }

    const envFile = resolve(".env.api.js");
    let env = fs.readFileSync(envFile, "utf-8");
    env = env.replace("[JWT_SECRET]", jwtSecret);
    await fs.writeFile(envFile, env);

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
