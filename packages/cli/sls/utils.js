const { join } = require("path");
const loadJson = require("load-json-file");

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

module.exports = { isApiEnvDeployed, isAppsEnvDeployed };
