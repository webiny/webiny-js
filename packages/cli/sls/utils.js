const { join } = require("path");
const fs = require("fs");
const { green } = require("chalk");
const loadJson = require("load-json-file");
const { GetEnvVars } = require("env-cmd");

const isApiEnvDeployed = async env => {
    const envFile = join(process.cwd(), "api", ".serverless", `Webiny.${env}.json`);
    try {
        const json = await loadJson(envFile);
        return json.components && json.outputs;
    } catch (err) {
        return false;
    }
};

const isAppsEnvDeployed = async env => {
    const envFile = join(process.cwd(), "apps", ".serverless", `Webiny.${env}.json`);
    try {
        const json = await loadJson(envFile);
        return json.components && json.outputs;
    } catch (err) {
        return false;
    }
};

const loadEnv = async (envPath, env, { debug = false }) => {
    if (fs.existsSync(envPath)) {
        const envConfig = await GetEnvVars({
            rc: {
                environments: ["default", env],
                filePath: envPath
            }
        });

        Object.assign(process.env, envConfig);
        if (debug) {
            console.log(
                `💡 Loaded ${green(env)} environment from ${green(envPath)}...`
            );
        }
    }
};

module.exports = { isApiEnvDeployed, isAppsEnvDeployed, loadEnv };
