const path = require("path");
const execa = require("execa");

module.exports = params => {
    const { context, resource, config } = params;
    return new Promise(async resolve => {
        const [script, ...scriptParams] = config.script.split(" ");

        if (config.define) {
            const definitions = Object.keys(config.define).reduce((acc, key) => {
                acc[key] = JSON.stringify(config.define[key]);
                return acc;
            }, {});
            scriptParams.push("--define");
            scriptParams.push(JSON.stringify(definitions));
        }

        context.instance.debug("Building %o", resource);
        try {
            await execa(script, scriptParams, {
                cwd: path.resolve(config.root)
            });
        } catch (err) {
            console.log(err.stderr);
            process.exit(1);
        }
        context.instance.debug("Finished building %o", resource);
        resolve();
    });
};
