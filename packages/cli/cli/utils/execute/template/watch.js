const { resolve } = require("path");
const { green, red, blue } = require("chalk");
const chokidar = require("chokidar");
const ora = require("ora");
const { paths } = require("../../paths");

let deployInProgress = false;

const onChange = ({ resource, execute }) => {
    let firstChange = true;
    let interval;
    let number;
    const spinner = ora();
    const spinnerText = number => `Deploying ${green(resource)} in ${number}...`;

    return async file => {
        clearInterval(interval);
        spinner.stop();

        if (deployInProgress) {
            console.log(`\n🚨 ${red("Another deploy is already in progress!\n")}`);
            return;
        }

        if (firstChange) {
            deployInProgress = true;
            await execute(resource);
            firstChange = false;
            deployInProgress = false;
            return;
        } else {
            console.log(`File changed: ${blue(paths.replaceProjectRoot(file))}`);
        }

        number = 3;
        spinner.text = spinnerText(number);
        spinner.start();
        interval = setInterval(async () => {
            number--;
            spinner.text = spinnerText(number);
            if (number === 0) {
                clearInterval(interval);
                spinner.stop();
                deployInProgress = true;
                try {
                    await execute(resource);
                } catch (e) {
                    console.log(`🚨 ${e.message}`);
                } finally {
                    deployInProgress = false;
                    console.log(`Watching for changes...`);
                }
            }
        }, 1000);
    };
};

module.exports = (execute, resource, config) => {
    if (!config.watch) {
        return;
    }

    const globs = config.watch.map(glob => {
        if (glob.startsWith("./")) {
            return resolve(glob);
        }
        return glob;
    });

    const watcher = chokidar.watch(globs, { awaitWriteFinish: true });
    watcher.on("change", onChange({ resource, execute }));
};
