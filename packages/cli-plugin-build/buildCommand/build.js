const { cyan } = require("chalk");
const { resolve, join } = require("path");
const execa = require("execa");
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

    const workingPath = join(process.cwd(), path).replace(/\\/g, "/");

    const packages = getPackages().filter(item => item.includes(workingPath));

    console.log(
        `🚧 Building ${packages.length} package(s) in ${cyan(join(process.cwd(), path))}...`
    );

    for (let i = 0; i < packages.length; i++) {
        const cwd = packages[i];
        console.log();
        console.log(cyan(`➜ ${cwd}`));
        await execa("yarn", ["build", "--env", env], { cwd, stdio: "inherit" });
    }
};
