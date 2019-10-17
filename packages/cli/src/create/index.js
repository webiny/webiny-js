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
    fs.ensureDirSync("api");
    fs.ensureDirSync("packages");

    // Copy project files
    const files = [
        "README.md",
        "example.gitignore",
        "example.env.js",
        ".prettierrc.js",
        "babel.config.js",
        "package.json"
    ];
    files.forEach(file => copyFile(`template/${file}`, file));
    fs.renameSync(".gitignore.example", ".gitignore");

    // Setup monorepo packages
    await setupFolder("apps/code");
    fs.renameSync("apps/code/admin/example.gitignore", "apps/code/admin/.gitignore");
    fs.renameSync("apps/code/admin/example.env.js", "apps/code/admin/.env.js");
    fs.renameSync("apps/code/site/example.gitignore", "apps/code/site/.gitignore");
    fs.renameSync("apps/code/site/example.env.js", "apps/code/site/.env.js");

    await setupFolder("apps/prod");
    await setupFolder("api/prod");
    await setupFolder("packages/theme");

    // Update config
    const jwtSecret = crypto
        .randomBytes(128)
        .toString("base64")
        .slice(0, 60);

    const envExample = resolve("api/prod/example.env");
    if (fs.existsSync(envExample)) {
        fs.renameSync(envExample, "api/prod/.env");
    }

    const envFile = resolve("api/prod/.env");
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
