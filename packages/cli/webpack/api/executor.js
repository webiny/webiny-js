const webpack = require("webpack");

module.exports = ({ watch }) => config => {
    return new Promise(async (resolve, reject) => {
        console.log(`Start bundling`);

        if (watch) {
            return webpack(config).watch({}, async (err, stats) => {
                if (err) {
                    return reject(err);
                }

                if (stats.hasErrors()) {
                    const info = stats.toJson();

                    if (stats.hasErrors()) {
                        console.error(info.errors);
                    }
                }

                console.log(`Finished bundling! Watching for changes...`);
            });
        }

        return webpack(config).run(async (err, stats) => {
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

            console.log(`Finished bundling`);
            resolve();
        });
    });
};
