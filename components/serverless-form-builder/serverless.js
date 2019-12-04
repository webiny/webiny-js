const { join } = require("path");
const { Component } = require("@serverless/core");
const loadJson = require("load-json-file");
const get = require("lodash.get");

const getDeps = async deps => {
    const { dependencies } = await loadJson(join(__dirname, "package.json"));
    return deps.reduce((acc, item) => {
        acc[item] = dependencies[item];
        return acc;
    }, {});
};

class ServerlessForms extends Component {
    async default(inputs = {}) {
        const { plugins = [], env, files, i18n, ...rest } = inputs;

        plugins.unshift("@webiny/api-forms/plugins");
        plugins.unshift("@webiny/api-i18n/plugins/service");

        const apolloService = await this.load("@webiny/serverless-apollo-service");
        const output = await apolloService({
            plugins,
            env: {
                ...env,
                FILES_API_URL: get(files, "api.graphqlUrl"),
                I18N_API_URL: get(i18n, "api.graphqlUrl")
            },
            ...rest,
            dependencies: await getDeps(["@webiny/api-forms"])
        });

        this.state.output = output;
        await this.save();

        return output;
    }

    async remove(inputs = {}) {
        const apolloService = await this.load("@webiny/serverless-apollo-service");
        await apolloService.remove(inputs);

        this.state = {};
        await this.save();
    }
}

module.exports = ServerlessForms;
