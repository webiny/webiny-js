const { join } = require("path");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const { getStateValues } = require("@webiny/project-utils/serverless");

const envMap = {
    REACT_APP_USER_POOL_REGION: "${cognito.userPool.Region}",
    REACT_APP_API_ENDPOINT: "${cdn.url}/graphql",
    REACT_APP_FILES_PROXY: "${cdn.url}",
    REACT_APP_USER_POOL_ID: "${cognito.userPool.Id}",
    REACT_APP_USER_POOL_WEB_CLIENT_ID: "${cognito.appClients[0].ClientId}"
};

module.exports = {
    hooks: {
        async stateChanged({ env, state }) {
            const envPath = join(__dirname, ".env.json");
            const json = await loadJson(envPath);
            if (!json[env]) {
                json[env] = {};
            }
            Object.assign(json[env], await getStateValues(state, envMap));
            await writeJson(envPath, json);
        }
    }
};
