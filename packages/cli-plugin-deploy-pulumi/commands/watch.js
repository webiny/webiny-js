const path = require("path");
const loadEnvVariables = require("../utils/loadEnvVariables");
const getPulumi = require("../utils/getPulumi");
const login = require("../utils/login");
const execa = require("execa");
const blessed = require("blessed");
const contrib = require("blessed-contrib");
const loadJsonFile = require("load-json-file");

const SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER;

module.exports = async (inputs, context) => {
    if (!inputs.env) {
        throw new Error(`Please specify environment, for example "dev".`);
    }

    if (!inputs.build && !inputs.deploy) {
        throw new Error(`Both re-build and re-deploy actions were disabled, can't continue.`);
    }

    // 1. Create screen on which we'll show logs.
    const { screen, logs } = createScreen(inputs);

    screen.render();

    if (inputs.deploy) {
        logs.deploy.log("Watching cloud infrastructure resources...");
        await loadEnvVariables(inputs, context);

        const { env, folder } = inputs;
        const stackDir = path.join(".", folder);

        await login(stackDir, context.paths.projectRoot);

        const pulumi = getPulumi({
            execa: {
                cwd: stackDir
            }
        });

        let stackExists = true;
        try {
            await pulumi.run(
                { command: ["stack", "select", env] },
                {
                    args: {
                        secretsProvider: SECRETS_PROVIDER
                    }
                }
            );
        } catch (e) {
            stackExists = false;
        }

        if (!stackExists) {
            throw new Error(`Please specify an existing environment, for example "dev".`);
        }

        const watchCloudInfrastructure = pulumi.run({
            command: "watch",
            args: {
                secretsProvider: SECRETS_PROVIDER
            },
            execa: {
                env: {
                    WEBINY_ENV: env,
                    WEBINY_PROJECT_NAME: context.projectName
                }
            }
        });

        watchCloudInfrastructure.stdout.on("data", data => logs.deploy.log(data.toString()));
        watchCloudInfrastructure.stderr.on("data", data => logs.deploy.log(data.toString()));
    }

    if (inputs.build) {
        logs.build.log("Watching packages...");
        const allPackages = await execa("yarn", [
            "webiny",
            "workspaces",
            "list",
            "--json",
            "--with-path"
        ]).then(({ stdout }) => JSON.parse(stdout));

        const watchedPackages = [...inputs.scope];
        if (watchedPackages.length === 0) {
            // 1. Get all packages withing the project application folder.
            const projectApplicationPackages = {};
            const projectApplicationPath = path.join(context.paths.projectRoot, inputs.folder);
            for (const pckgName in allPackages) {
                const pckgPath = allPackages[pckgName];
                if (pckgPath.startsWith(projectApplicationPath)) {
                    projectApplicationPackages[pckgName] = pckgPath;
                }
            }

            // 2. Get all packages that are located outside of the project application folder.
            for (const pckgName in projectApplicationPackages) {
                const packagePath = projectApplicationPackages[pckgName];
                const packageJsonPath = path.join(packagePath, "package.json");
                const {
                    dependencies = {},
                    devDependencies = {},
                    peerDependencies = {}
                } = loadJsonFile.sync(packageJsonPath);

                // Add dependencies.
                for (const packageName in dependencies) {
                    if (allPackages[packageName]) {
                        watchedPackages.push(packageName);
                    }
                }

                // Add devDependencies.
                for (const packageName in devDependencies) {
                    if (allPackages[packageName]) {
                        watchedPackages.push(packageName);
                    }
                }

                // Add peerDependencies.
                for (const packageName in peerDependencies) {
                    if (allPackages[packageName]) {
                        watchedPackages.push(packageName);
                    }
                }
            }

            watchedPackages.push(...Object.keys(projectApplicationPackages));
        }

        const watchPackages = execa("yarn", [
            "webiny",
            "workspaces",
            "run",
            "watch",
            "--scope",
            "@webiny/api-file-manager"
        ]);

        watchPackages.stdout.on("data", data => logs.build.log(data.toString()));
        watchPackages.stderr.on("data", data => logs.build.log(data.toString()));
    }
};

/**
 * Figures out the number of rows and the layout of each grid that holds logs.
 * Could've we write this better? Yes. But for now as, as this is as far it'll go, it's fine.
 * In the future, if needed, introduce a smarter logic here.
 */
const createScreen = inputs => {
    // Setup blessed screen.
    const screen = blessed.screen({
        smartCSR: true,
        useBCE: true,
        dockBorders: true
    });

    const { build, deploy } = inputs;
    const output = { screen, grid: null, logs: { build: null, deploy: null } };

    if (build && deploy) {
        output.grid = new contrib.grid({ rows: 3, cols: 1, screen: screen });
        output.logs.build = output.grid.set(0, 0, 2, 1, contrib.log, {
            label: "Build",
            scrollOnInput: true
        });

        output.logs.deploy = output.grid.set(2, 0, 1, 1, contrib.log, {
            label: "Deploy",
            scrollOnInput: true
        });

        return output;
    }

    if (deploy) {
        output.grid = new contrib.grid({ rows: 3, cols: 1, screen: screen });
        output.logs.deploy = output.grid.set(0, 0, 3, 1, contrib.log, {
            label: "Deploy",
            scrollOnInput: true
        });

        return output;
    }

    if (build) {
        output.grid = new contrib.grid({ rows: 3, cols: 1, screen: screen });
        output.logs.build = output.grid.set(0, 0, 3, 1, contrib.log, {
            label: "Build",
            scrollOnInput: true
        });

        return output;
    }
};
