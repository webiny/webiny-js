const yargs = require("yargs");
const path = require("path");
const getPackages = require("get-yarn-workspaces");
const execa = require("execa");
const { Listr } = require("listr2");

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
        { concurrent: true, exitOnError: false, collectErrors: "minimal" }
    );

    await tasks.run();

    if (tasks.errors.length) {
        console.log();
        console.log(`Error building ${tasks.errors.length} package(s). Check the logs below.`);
        console.log();

        tasks.errors.forEach(listrError => {
            console.log(`✖ ${listrError.message}`);
            if (listrError.error) {
                console.log(listrError.error.message);
            }
            console.log();
        });

        process.exit(1);
    }
})();
