const execa = require("execa");
const fs = require("fs");
const path = require("path");
const { featureFlags } = require("@webiny/feature-flags");

const listPackages = async ({ inputs }) => {
    let packagesList = [];
    if (inputs.package) {
        packagesList = Array.isArray(inputs.package) ? [...inputs.package] : [inputs.package];

        if (featureFlags.watchCommandPackagesWithoutWebinyScope) {
            // When providing packages manually, we also allow providing names of Webiny packages
            // without the `@webiny` scope. In that case, we need to add the scope to the package name.
            const webinyPrefixedPackagesToAdd = [];
            for (let i = 0; i < packagesList.length; i++) {
                if (!packagesList[i].startsWith("@webiny")) {
                    webinyPrefixedPackagesToAdd.push(`@webiny/${packagesList[i]}`);
                }
            }

            packagesList.push(...webinyPrefixedPackagesToAdd);
        }
    } else {
        packagesList = await execa("yarn", [
            "webiny",
            "workspaces",
            "tree",
            "--json",
            "--depth",
            inputs.depth,
            "--distinct",
            "--folder",
            inputs.folder
        ]).then(({ stdout }) => JSON.parse(stdout));
    }

    const commandArgs = [
        "webiny",
        "workspaces",
        "list",
        "--json",
        "--withPath",
        ...packagesList.reduce((current, item) => {
            current.push("--scope", item);
            return current;
        }, [])
    ];

    if (inputs.env) {
        commandArgs.push("--env", inputs.env);
    }

    return execa("yarn", commandArgs).then(({ stdout }) => {
        const result = JSON.parse(stdout);
        const packages = [];
        for (const packageName in result) {
            const root = result[packageName];
            const configPath = fs.existsSync(path.join(root, "webiny.config.ts"))
                ? path.join(root, "webiny.config.ts")
                : path.join(root, "webiny.config.js");

            packages.push({
                name: packageName,
                config: require(configPath).default || require(configPath),
                paths: {
                    root,
                    config: configPath
                }
            });
        }

        return packages;
    });
};

module.exports = listPackages;
