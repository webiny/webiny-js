const { cyan } = require("chalk");
const { join } = require("path");
const execa = require("execa");
const getPackages = require("get-yarn-workspaces");
const loadEnvVariables = require("./loadEnvVariables");

module.exports = async (inputs, context) => {
    const { env, path } = inputs;

    await loadEnvVariables(inputs, context);

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
