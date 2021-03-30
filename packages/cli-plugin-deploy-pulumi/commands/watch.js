const execa = require("execa");
const blessed = require("blessed");
const contrib = require("blessed-contrib");
const { login, getPulumi, loadEnvVariables, getProjectApplication } = require("../utils");
const { green } = require("chalk");

const SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER;

module.exports = async (inputs, context) => {
    if (!inputs.env) {
        throw new Error(`Please specify environment, for example "dev".`);
    }

    if (!inputs.build && !inputs.deploy) {
        throw new Error(`Both re-build and re-deploy actions were disabled, can't continue.`);
    }

    // Get project application metadata.
    const projectApplication = getProjectApplication(inputs.folder);

    // 1. Initial checks for deploy and build commands. We want to do these before initializing the
    //    blessed screen, because it messes the terminal output a bit. With this approach, we avoid that.

    // 1.1. Check if the project application and Pulumi stack exist.
    if (inputs.deploy) {
        await loadEnvVariables(inputs, context);

        const { env } = inputs;

        await login(projectApplication);

        const pulumi = await getPulumi({
            execa: {
                cwd: projectApplication.path.absolute
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
    }

    // 2. Create screen on which we'll show logs.
    const { screen, logs } = createScreen(inputs);

    screen.render();

    try {
        // Add deploy logs.
        if (inputs.deploy) {
            logs.deploy.log(green("Watching cloud infrastructure resources..."));

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

        // Add build logs.
        if (inputs.build) {
            logs.build.log(green("Watching packages..."));

            const scopes = await execa("yarn", [
                "webiny",
                "workspaces",
                "tree",
                "--json",
                "--depth",
                "5",
                "--distinct",
                "--folder",
                inputs.folder
            ]).then(({ stdout }) => JSON.parse(stdout));

            const watchPackages = execa("yarn", [
                "webiny",
                "workspaces",
                "run",
                "watch",
                ...scopes.reduce((current, item) => {
                    current.push("--scope", item);
                    return current;
                }, [])
            ]);

            watchPackages.stdout.on("data", data => logs.build.log(data.toString()));
            watchPackages.stderr.on("data", data => logs.build.log(data.toString()));
        }
    } catch (e) {
        screen.destroy();
        throw e;
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
