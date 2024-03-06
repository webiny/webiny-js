const fs = require("fs-extra");
const path = require("path");
const execa = require("execa");
const crypto = require("crypto");
const renames = require("./setup/renames");
const merge = require("lodash/merge");
const writeJsonFile = require("write-json-file");
const loadJsonFile = require("load-json-file");
const getPackages = require("get-yarn-workspaces");
const { green, yellow } = require("chalk");

const IS_TEST = process.env.NODE_ENV === "test";

// Automatic detection could be added here.
function getDefaultRegion() {
    return "us-east-1";
}

function random(length = 32) {
    return crypto
        .randomBytes(Math.ceil(length / 2))
        .toString("hex")
        .slice(0, length);
}

const setup = async args => {
    const { isGitAvailable, projectRoot, projectName, templateOptions = {} } = args;
    const { region = getDefaultRegion(), storageOperations = "ddb" } = templateOptions;
    /**
     * We need to check for the existence of the common and storageOperations folders to continue.
     */
    if (!storageOperations) {
        console.log("Missing storage operations parameter.");
        process.exit(1);
    }

    const commonTemplate = path.join(__dirname, `template/common`);
    const storageOperationsTemplate = path.join(__dirname, `template/${storageOperations}`);
    if (!fs.existsSync(commonTemplate)) {
        console.log(`Missing common template folder "${commonTemplate}".`);
        process.exit(1);
    } else if (!fs.existsSync(storageOperationsTemplate)) {
        console.log(
            `Missing storage operations "${storageOperations}" template folder "${storageOperationsTemplate}".`
        );
        process.exit(1);
    }

    /**
     * Then we copy the common template folder and selected storage operations folder.
     */
    fs.copySync(commonTemplate, projectRoot);
    fs.copySync(storageOperationsTemplate, projectRoot);

    for (let i = 0; i < renames.length; i++) {
        fs.moveSync(
            path.join(projectRoot, renames[i].prev),
            path.join(projectRoot, renames[i].next),
            {
                overwrite: true
            }
        );
    }

    const dependenciesJsonPath = path.join(projectRoot, "dependencies.json");
    const packageJsonPath = path.join(projectRoot, "package.json");

    const dependenciesJson = await loadJsonFile(dependenciesJsonPath);
    const packageJson = await loadJsonFile(packageJsonPath);

    merge(packageJson, dependenciesJson);

    await writeJsonFile(packageJsonPath, packageJson);

    await fs.removeSync(dependenciesJsonPath);

    const { name, version } = require("./package.json");

    if (!IS_TEST && isGitAvailable) {
        // Commit .gitignore.
        try {
            execa.sync("git", ["add", ".gitignore"], { cwd: projectRoot });
            execa.sync("git", ["commit", "-m", `chore: initialize .gitignore`], {
                cwd: projectRoot
            });
        } catch (e) {
            console.log(
                yellow(
                    "Failed to commit .gitignore. You will have to do it manually once the project is created."
                )
            );
        }
    }

    const rootEnvFilePath = path.join(projectRoot, ".env");
    let content = fs.readFileSync(rootEnvFilePath).toString();
    content = content.replace("{REGION}", region);
    content = content.replace("{PULUMI_CONFIG_PASSPHRASE}", random());
    content = content.replace("{PULUMI_SECRETS_PROVIDER}", "passphrase");
    fs.writeFileSync(rootEnvFilePath, content);

    let projectFile = fs.readFileSync(path.join(projectRoot, "webiny.project.ts"), "utf-8");
    projectFile = projectFile.replace("[PROJECT_NAME]", projectName);
    projectFile = projectFile.replace("[TEMPLATE_VERSION]", `${name}@${version}`);
    fs.writeFileSync(path.join(projectRoot, "webiny.project.ts"), projectFile);

    // Adjust versions - change them from `latest` to current one.
    const latestVersion = version;

    const workspaces = [projectRoot, ...getPackages(projectRoot)];

    for (let i = 0; i < workspaces.length; i++) {
        const packageJsonPath = path.join(workspaces[i], "package.json");
        const packageJson = await loadJsonFile(packageJsonPath);
        const depsList = Object.keys(packageJson.dependencies).filter(name =>
            name.startsWith("@webiny")
        );

        depsList.forEach(name => {
            packageJson.dependencies[name] = latestVersion;
        });

        await writeJsonFile(packageJsonPath, packageJson);
    }

    if (!IS_TEST) {
        console.log(`⏳ Installing dependencies....`);
        console.log();
        // Install dependencies.
        const options = {
            cwd: projectRoot,
            maxBuffer: "500_000_000",
        };

        try {
            await execa("yarn", [], options);
        } catch (e) {
            throw new Error(
                "Failed while installing project dependencies. Please check the above Yarn logs for more information."
            );
        }
    }

    if (!IS_TEST) {
        console.log(
            [
                "",
                `🎉 Your new Webiny project ${green(projectName)} is ready!`,
                "",
                `Finish the setup by running the following command: ${green(
                    `cd ${projectName} && yarn webiny deploy`
                )}`,
                "",
                `To see all of the available CLI commands, run ${green(
                    "yarn webiny --help"
                )} in your ${green(projectName)} directory.`,
                "",
                "Want to dive deeper into Webiny? Check out https://webiny.com/docs/!",
                "Like the project? Star us on https://github.com/webiny/webiny-js!",
                "",
                "Need help? Join our Slack community! https://www.webiny.com/slack",
                "",
                "🚀 Happy coding!"
            ].join("\n")
        );
    }
};

module.exports = setup;
