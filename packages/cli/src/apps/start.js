const path = require("path");
const execa = require("execa");
const getAppConfig = require("../utils/getAppConfig");
const { server: runSsrServer } = require("./ssrServer");

module.exports = async ({ name, ssr, appBuild }) => {
    const { env } = await getAppConfig(name);

    const cwd = path.resolve(`packages/${name}`);

    if (ssr) {
        // Build SSR handler and start SSR server
        process.chdir(cwd);

        if (appBuild) {
            await execa("yarn", ["build"], {
                cwd,
                env: { ...env, REACT_APP_ENV: "browser" },
                stdio: "inherit"
            });
        }

        await execa("yarn", ["build:ssr"], {
            cwd,
            env: { ...env, REACT_APP_ENV: "ssr" },
            stdio: "inherit"
        });

        runSsrServer({ root: cwd, port: process.env.PORT || env.PORT || 8888 });
    } else {
        // Start development build
        execa("yarn", ["start"], { cwd, env, stdio: "inherit" });
    }
};
