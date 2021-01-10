const chalk = require("chalk");
const randomColor = require("random-color");
const execa = require("execa");
const pMap = require("p-map");
const { createGraph, getPackages, normalizeArray } = require("./utils");

const logLine = prefix => data => {
    const line = data.toString().replace(/\s\s*$/gm, "");
    console.log(`${prefix}: ${line.replace("webiny: ", "")}`);
};

module.exports = async (inputs, context) => {
    if (inputs.script === "watch") {
        inputs.parallel = true;
    }
    const { script, scope, folder, parallel, stream } = inputs;
    const scopes = normalizeArray(scope);
    const folders = normalizeArray(folder);

    const runScript = pkg => {
        return new Promise((resolve, reject) => {
            const color = randomColor().hexString();
            const prefix = chalk.hex(color).bold(pkg.name);
            const logger = logLine(prefix);
            const process = execa("yarn", [script], { cwd: pkg.path });

            if (stream) {
                process.stdout.on("data", logger);
                process.stderr.on("data", logger);
            }

            process.on("exit", code => {
                if (code === 0) {
                    return resolve();
                }

                context.error(`Script failed in package ${prefix}!`);

                reject();
            });
        });
    };

    const running = new Set();

    const runScriptTopologically = async (packages, graph) => {
        const leafs = graph.sinks().filter(leaf => !running.has(leaf));
        if (!leafs.length) {
            return;
        }

        await pMap(leafs, name => {
            running.add(name);
            return runScript(packages.find(pkg => pkg.name === name)).then(() => {
                graph.removeNode(name);
                return runScriptTopologically(packages, graph);
            });
        });
    };

    const packages = getPackages({ script, scopes, folders });

    if (!packages.length) {
        context.info(`No workspaces satisfy the criteria to run the script!`);
        context.info(
            `Either the script ${chalk.green(
                script
            )} doesn't exist or none of the workspaces matched the filter.`
        );
        return;
    }

    if (!scopes.length) {
        context.info(`Running %o in %o packages`, script, packages.length);
    } else {
        context.info(
            `Running %o in %o packages %O`,
            script,
            packages.length,
            packages.map(pkg => pkg.name)
        );
    }

    if (parallel) {
        context.info(`Running %o in parallel`, script);
        await pMap(packages, pkg => runScript(pkg));
        return;
    }

    // Build dependency graph
    const graph = createGraph(packages);

    await runScriptTopologically(packages, graph);
};
