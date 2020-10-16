const { green } = require("chalk");
const { resolve, join } = require("path");
const execa = require("execa");
const ProgressBar = require("progress");
const getPackages = require("get-yarn-workspaces");

module.exports = async (inputs, context) => {
    const { env, path, debug = true } = inputs;

    const projectRoot = context.paths.projectRoot;

    if (env) {
        // Load .env.json from project root.
        await context.loadEnv(resolve(projectRoot, ".env.json"), env, { debug });

        // Load .env.json from cwd (this will change depending on the folder you specified).
        await context.loadEnv(resolve(projectRoot, path, ".env.json"), env, { debug });
    }

    const packages = getPackages().filter(item => item.includes(join(process.cwd(), path)));

    console.log(
        `⏳  Building ${packages.length} package(s) in ${green(join(process.cwd(), path))}...`
    );

    const bar = new ProgressBar("[:bar] :percent (:current/:total)", {
        complete: "=",
        incomplete: " ",
        width: 1024,
        total: packages.length
    });

    const promises = [];
    for (let i = 0; i < packages.length; i++) {
        promises.push(
            new Promise(async (resolve, reject) => {
                try {
                    const cwd = packages[i];
                    await execa("yarn", ["build", "--env", env], { cwd });
                    bar.tick();

                    resolve();
                } catch (e) {
                    reject(e);
                }
            })
        );
    }

    await Promise.all(promises);
};
