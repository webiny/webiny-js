const { join } = require("path");
const fs = require("fs");
const { green } = require("chalk");
const loadJson = require("load-json-file");
const { GetEnvVars } = require("env-cmd");
const { paths } = require("./paths");

const isEnvDeployed = async ({ folder, env }) => {
    const envFile = join(paths.projectRoot, ".webiny", "state", folder, env, `Webiny.json`);
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
                `💡 Loaded ${green(env)} environment from ${green(
                    paths.replaceProjectRoot(envPath)
                )}...`
            );
        }
    }
};

module.exports = { isEnvDeployed, loadEnv };
