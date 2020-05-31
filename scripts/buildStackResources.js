const yargs = require("yargs");
const path = require("path");
const getPackages = require("get-yarn-workspaces");
const execa = require("execa");
const Listr = require("listr");

(async () => {
    const { stack, run = "build" } = yargs.argv;

    console.log(`Preparing "${stack}" stack...`);
    const packages = getPackages().filter(p => p.includes(`/${stack}/`));

    const tasks = new Listr(
        packages.map(workspace => {
            return {
                title: workspace.replace(process.cwd(), ""),
                task: () => execa("yarn", [run], { cwd: path.resolve(workspace) })
            };
        }),
        { concurrent: true }
    );

    await tasks.run();
})();
