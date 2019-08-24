const path = require("path");
const execa = require("execa");
const get = require("lodash.get");
const loadJson = require("load-json-file");
const getAppConfig = require("../utils/getAppConfig");
const logger = require("../logger")();

module.exports = async ({ name }) => {
    const { env, ssr } = await getAppConfig(name);

    const cwd = path.resolve(`packages/${name}`);
    await execa("yarn", ["build"], {
        cwd,
        env: { ...env, REACT_APP_ENV: "browser" },
        stdio: "inherit"
    });

    if (ssr) {
        const pkg = loadJson.sync(path.join(cwd, "package.json"));
        if (!get(pkg, "scripts.build:ssr")) {
            logger.error(
                `%s doesn't have a script "build:ssr"! This script is mandatory for SSR enabled apps.`,
                name
            );
            process.exit(1);
        }

        await execa("yarn", ["build:ssr"], {
            cwd,
            env: { ...env, REACT_APP_ENV: "ssr" },
            stdio: "inherit"
        });
    }
};
