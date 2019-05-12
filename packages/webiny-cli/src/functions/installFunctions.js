const path = require("path");
const get = require("lodash.get");
const listPackages = require("../utils/listPackages");
const getConfig = require("../utils/getConfig");

module.exports = async () => {
    require("@babel/register")({
        only: [/packages/],
        configFile: path.resolve("babel.config.js")
    });

    const { config } = await getConfig();
    const functions = await listPackages("function");

    for (let i = 0; i < functions.length; i++) {
        const fn = functions[i];
        if (!fn.install) {
            continue;
        }

        const env = get(config, `functions.${fn.package.name}.env`, {});

        const vars = Object.keys(env);
        vars.forEach(key => {
            process.env[key] = env[key];
        });

        const { install } = require(path.join(fn.root, fn.install));
        if (!install) {
            continue;
        }

        const context = {
            cms: { copyFiles: true, copyFilesTo: path.resolve(process.env.UPLOADS_FOLDER) }
        };

        await install(context);
    }
};
