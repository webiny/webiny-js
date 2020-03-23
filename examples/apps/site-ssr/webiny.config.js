const { join } = require("path");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const { getStateValues, buildAppSSR } = require("@webiny/project-utils");

const envMap = {
    REACT_APP_GRAPHQL_API_URL: "${cdn.url}/graphql",
    REACT_APP_API_URL: "${cdn.url}",
    REACT_APP_FILES_PROXY: "${cdn.url}"
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
    },
    commands: {
        // TODO: mozda ovo mozemo prebaciti u `site` app ? samo dodamo 1 extra komandu za buildanje SSR-a
        async build(options, context) {
            // By defining the path to the app you want to SSR, we assume the following:
            // - the app build is located at `{app}/build`
            // - the `App` component can be imported from `{app}/src/App`
            await buildAppSSR({ app: "../site" }, context);
        }
    }
};
