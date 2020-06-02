#!/usr/bin/env node
const readJson = require("load-json-file");
const getWorkspaces = require("get-yarn-workspaces");
const { yellow } = require("chalk");
const execa = require("execa");

const getPackages = () => {
    return getWorkspaces()
        .map(path => {
            const packageJsonPath = path + "/package.json";
            try {
                return { packageJsonPath, packageJson: readJson.sync(packageJsonPath) };
            } catch {
                console.log(yellow(`Ignoring ${path}/package.json`));
                return null;
            }
        })
        .filter(Boolean);
};

const allPackages = {
    groups: {
        base: [],
        api: [],
        app: [],
        handler: [],
        serverless: []
    },
    list: getPackages()
};

for (let i = 0; i < allPackages.list.length; i++) {
    const item = allPackages.list[i];
    if (item.packageJsonPath.includes("/api")) {
        allPackages.groups.api.push(item);
        continue;
    }

    if (item.packageJsonPath.includes("/app")) {
        allPackages.groups.app.push(item);
        continue;
    }

    if (item.packageJsonPath.includes("/serverless")) {
        allPackages.groups.serverless.push(item);
        continue;
    }

    // Using "/handler-" instead of "/handler", because "handler" is a base package.
    if (item.packageJsonPath.includes("/handler-")) {
        allPackages.groups.handler.push(item);
        continue;
    }

    allPackages.groups.base.push(item);
}

const outputStdOut = (title, stdout) => {
    console.log(yellow(`-------------------------- [START] Packages group: "${title}" --------------------------`));
    console.log(stdout);
    console.log(yellow(`-------------------------- [END] Packages group: "${title}" --------------------------`));
};

const executeLernaBuild = packagesGroup => {
    const packages = [];
    for (let i = 0; i < allPackages.groups[packagesGroup].length; i++) {
        const item = allPackages.groups[packagesGroup][i];
        packages.push("--scope");
        packages.push(item.packageJson.name);
    }

    const command = ["lerna", "run", "build", "--stream", ...packages];
    console.log("[execa] ", "yarn ", command.join(" "));
    return execa("yarn", command);
};

(async () => {
    const executedProcess = await executeLernaBuild("base");
    outputStdOut("base", executedProcess.stdout);

    const concurrentBuilds = [];

    concurrentBuilds.push(
        executeLernaBuild("handler").then(executedProcess => {
            outputStdOut("/handler-", executedProcess.stdout);
        })
    );

    concurrentBuilds.push(
        executeLernaBuild("api").then(executedProcess => {
            outputStdOut("/api", executedProcess.stdout);
        })
    );

    concurrentBuilds.push(
        executeLernaBuild("app").then(executedProcess => {
            outputStdOut("/app", executedProcess.stdout);
        })
    );

    concurrentBuilds.push(
        executeLernaBuild("serverless").then(executedProcess => {
            outputStdOut("/serverless", executedProcess.stdout);
        })
    );

    await Promise.all(concurrentBuilds);
})();
