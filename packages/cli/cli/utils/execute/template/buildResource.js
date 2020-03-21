const path = require("path");
const { green, red } = require("chalk");
const fs = require("fs-extra");
const pkgDir = require("pkg-dir");
const ora = require("ora");
const webpack = require("webpack");
let babelOptions = require("./babelrc.js");

const createConfig = async ({ debug, config, context }) => {
    const packageRoot = await pkgDir(config.entry);
    const webinyConfig = path.join(packageRoot, "webiny.js");
    let customizer = null;

    if (fs.existsSync(webinyConfig)) {
        customizer = require(webinyConfig);
        if (customizer && typeof customizer.babel === "function") {
            context.instance.debug("Customizing babel options");
            babelOptions = customizer.babel(babelOptions);
        }
    }

    const output = config.output ? path.resolve(config.output) : path.resolve(packageRoot, "build");

    // Create default webpack config
    let wpConfig = require(__dirname + "/webpack.config.js")({
        root: packageRoot,
        entry: path.resolve(config.entry),
        debug: Boolean(debug),
        destination: output,
        babelOptions
    });

    if (customizer && typeof customizer.webpack === "function") {
        context.instance.debug("Customizing webpack config");
        wpConfig = customizer.webpack(wpConfig);
    }

    if (config.define) {
        const definitions = Object.keys(config.define).reduce((acc, key) => {
            acc[key] = JSON.stringify(config.define[key]);
            return acc;
        }, {});
        wpConfig.plugins.push(new webpack.DefinePlugin(definitions));
    }

    return wpConfig;
};

let deployInProgress = false;

const onChange = ({ callback, context, resource }) => {
    let interval;
    let number;
    const spinner = ora();
    const spinnerText = number => `Deploying ${green(resource)} in ${number}...`;

    return async () => {
        context.instance.debug(`📦 Changes detected in %o`, resource);
        clearInterval(interval);
        spinner.stop();

        if (deployInProgress) {
            context.instance.debug(`🚨 ${red("Another deploy is already in progress!")}`);
            return;
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
                    await callback();
                } catch (e) {
                    context.instance.debug(`🚨 ${e.message}`);
                } finally {
                    deployInProgress = false;
                    context.instance.debug(`Watching for changes on %o...`, resource);
                }
            }
        }, 1000);
    };
};

module.exports = params => {
    const { context, afterBuild, watch, resource } = params;
    // Bundle code (switch CWD before running webpack)
    return new Promise(async (resolve, reject) => {
        context.instance.debug(`Start bundling %o`, resource);
        const wpConfig = await createConfig(params);
        const rebuild = onChange({ callback: afterBuild, context, resource });

        if (watch) {
            let firstBuild = true;
            return webpack(wpConfig).watch({}, async (err, stats) => {
                if (err) {
                    return reject(err);
                }

                if (stats.hasErrors()) {
                    const info = stats.toJson();

                    if (stats.hasErrors()) {
                        console.error(info.errors);
                    }
                }

                context.instance.debug(`Finished bundling %o`, resource);
                if (firstBuild) {
                    firstBuild = false;
                    await afterBuild();
                    context.instance.debug(`Watching for changes on %o...`, resource);
                } else {
                    await rebuild();
                }
            });
        }

        return webpack(wpConfig).run(async (err, stats) => {
            if (err) {
                return reject(err);
            }

            if (stats.hasErrors()) {
                const info = stats.toJson();

                if (stats.hasErrors()) {
                    console.error(info.errors);
                }

                return reject("Build failed!");
            }

            context.instance.debug(`Finished bundling %o`, resource);
            if (typeof afterBuild === "function") {
                await afterBuild();
            }
            resolve();
        });
    });
};
