const path = require("path");
const execa = require("execa");

module.exports = params => {
    const { context, resource, config } = params;
    const stages = Array.isArray(config) ? config : [config];

    return new Promise(async resolve => {
        for (let i = 0; i < stages.length; i++) {
            const config = stages[i];
            const [script, ...scriptParams] = config.script.split(" ");

            if (config.define) {
                const definitions = Object.keys(config.define).reduce((acc, key) => {
                    acc[key] = JSON.stringify(config.define[key]);
                    return acc;
                }, {});
                scriptParams.push("--define");
                scriptParams.push(JSON.stringify(definitions));
            }

            if (stages.length > 1) {
                context.instance.debug("Building stage %o of %o", i + 1, resource);
            } else {
                context.instance.debug("Building %o", resource);
            }

            try {
                await execa(script, scriptParams, {
                    cwd: path.resolve(config.root),
                    stdio: config.verbose ? "inherit" : undefined,
                    env: process.env
                });
            } catch (err) {
                console.log(err.stderr);
                process.exit(1);
            }
        }
        context.instance.debug("Finished building %o", resource);

        resolve();
    });
};
