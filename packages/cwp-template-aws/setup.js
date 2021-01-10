const fs = require("fs-extra");
const path = require("path");
const execa = require("execa");
const crypto = require("crypto");
const renames = require("./setup/renames");
const merge = require("lodash/merge");
const writeJsonFile = require("write-json-file");
const loadJsonFile = require("load-json-file");
const getPackages = require("get-yarn-workspaces");
const { green } = require("chalk");

const IS_TEST = process.env.NODE_ENV === "test";

function random(length = 32) {
    return crypto
        .randomBytes(Math.ceil(length / 2))
        .toString("hex")
        .slice(0, length);
}

const setup = async args => {
    const { projectRoot, projectName, vpc, region } = args;

    const packageJsonExists = fs.pathExistsSync(path.join(projectRoot, "package.json"));
    if (!packageJsonExists) {
        throw new Error(
            `Cannot continue, ${path.join(projectRoot, "package.json")} does not exist.`
        );
    }

    fs.copySync(path.join(__dirname, "template"), projectRoot);

    for (let i = 0; i < renames.length; i++) {
        fs.moveSync(
            path.join(projectRoot, renames[i].prev),
            path.join(projectRoot, renames[i].next),
            { overwrite: true }
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

    if (!IS_TEST) {
        // Commit .gitignore.
        execa.sync("git", ["add", ".gitignore"], { cwd: projectRoot });
        execa.sync("git", ["commit", "-m", `chore: initialize .gitignore`], { cwd: projectRoot });
    }

    const rootEnvFilePath = path.join(projectRoot, ".env");
    let content = fs.readFileSync(rootEnvFilePath).toString();
    content = content.replace("{REGION}", region);
    content = content.replace("{PULUMI_CONFIG_PASSPHRASE}", random());
    content = content.replace("{PULUMI_SECRETS_PROVIDER}", "passphrase");
    fs.writeFileSync(rootEnvFilePath, content);

    let webinyRoot = fs.readFileSync(path.join(projectRoot, "webiny.root.js"), "utf-8");
    webinyRoot = webinyRoot.replace("[PROJECT_NAME]", projectName);
    webinyRoot = webinyRoot.replace("[TEMPLATE_VERSION]", `${name}@${version}`);
    fs.writeFileSync(path.join(projectRoot, "webiny.root.js"), webinyRoot);

    // Keep the needed stack.
    // Note: this approach most probably won't work when additional variables are added into the mix (e.g. ability
    // to choose a different default database, choose exact apps, backend for Pulumi, etc.) For now it works.
    let move = "no_vpc",
        remove = "vpc";

    if (vpc) {
        move = "vpc";
        remove = "no_vpc";
    }

    fs.removeSync(path.join(projectRoot, "api", `stack_${remove}`));
    fs.removeSync(path.join(projectRoot, "api", `index_${remove}.ts`));

    fs.moveSync(
        path.join(projectRoot, "api", `stack_${move}`),
        path.join(projectRoot, "api", "stack"),
        { overwrite: true }
    );

    fs.moveSync(
        path.join(projectRoot, "api", `index_${move}.ts`),
        path.join(projectRoot, "api", "index.ts"),
        { overwrite: true }
    );

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
            if (packageJson.dependencies[name] === "latest") {
                // Use version of @webiny/cli package (we have fixed package versioning)
                packageJson.dependencies[name] = `^` + latestVersion;
            }
        });

        await writeJsonFile(packageJsonPath, packageJson);
    }

    if (!IS_TEST) {
        console.log();
        console.log(`⏳ Installing dependencies....`);
        console.log();
        // Install dependencies.
        const options = {
            cwd: projectRoot,
            maxBuffer: "500_000_000",
            stdio: "inherit"
        };

        await execa("yarn", [], options);

        /*
        // TODO: finish logging.
        let logStream;
        if (log) {
            logStream = fs.createWriteStream(context.logPath);
            const runner = execa("yarn", [], options);
            runner.stdout.pipe(logStream);
            runner.stderr.pipe(logStream);
            await runner;
        } else {
            await execa("yarn", [], options);
        }*/
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
                "Want to delve deeper into Webiny? Check out https://docs.webiny.com!",
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
