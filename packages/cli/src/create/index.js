const path = require("path");
const crypto = require("crypto");
const fs = require("fs-extra");
const glob = require("glob");
const util = require("util");
const execa = require("execa");
const { green, blue } = require("chalk");
const { trackProject } = require("@webiny/tracking");

const globFiles = util.promisify(glob);

function copyFile(from, to) {
    fs.copySync(path.join(__dirname, from), path.resolve(to));
}

module.exports = async ({ name }) => {
    const root = path.join(process.cwd(), name);

    console.log(`Creating a new Webiny project in ${green(root)}...`);
    fs.ensureDirSync(root);
    process.chdir(root);

    fs.ensureDirSync("apps");
    fs.ensureDirSync("functions");
    fs.ensureDirSync("packages");

    // Copy project files
    const files = ["README.md", ".gitignore", ".prettierrc.js", "babel.config.js", "package.json"];
    files.forEach(file => copyFile(`template/${file}`, file));

    // Setup monorepo packages
    await setupFolder("apps/code");
    fs.renameSync("apps/code/admin/.gitignore.example", "apps/code/admin/.gitignore");
    fs.renameSync("apps/code/site/.gitignore.example", "apps/code/site/.gitignore");

    await setupFolder("apps/prod");
    await setupFolder("functions/prod");
    await setupFolder("packages/theme");

    // Update config
    const jwtSecret = crypto
        .randomBytes(128)
        .toString("base64")
        .slice(0, 60);

    const envExample = path.resolve("functions/prod/.env.example");
    if (fs.existsSync(envExample)) {
        fs.renameSync(envExample, "functions/prod/.env");
    }

    const envFile = path.resolve("functions/prod/.env");
    let env = fs.readFileSync(envFile, "utf-8");
    env = env.replace("MyS3cr3tK3Y", jwtSecret);
    await fs.writeFile(envFile, env);

    await execa("yarn", [], { cwd: root, stdio: "inherit" });

    await trackProject();

    console.log();
    console.log("Your local Webiny project is ready!!");
    console.log("Now it is time to deploy your API 🚀");
    console.log(
        `\n1) Navigate to your ${blue(
            "functions/prod"
        )} folder and update the ENV variables in ${blue(".env")} file.`
    );
    console.log(
        `   NOTE: if you don't already have a Mongo database up and running in the cloud, to get one as fast as possible, we suggest ${blue(
            "Mongo Atlas"
        )}.`
    );
    console.log(
        `\n2) Next, run ${blue("sls")} inside of your ${blue(
            "functions/prod"
        )} folder to kick off the first deployment of your API.\n   It will take a minute or two to deploy, so be patient.`
    );
    console.log(
        `\n3) Once your API is deployed, you will see a list of cloud resources that were created.\n   Take note of the ${blue(
            "cdn.url"
        )}, you'll need it for your apps.`
    );

    console.log(
        `🏁 That's it! Now you have your API, admin and site apps up and running!\n  Happy coding :)`
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
