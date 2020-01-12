const { Component } = require("@serverless/core");
const get = require("lodash.get");

class ServerlessForms extends Component {
    async default(inputs = {}) {
        const { plugins = [], env, files, i18n, ...rest } = inputs;

        const apolloService = await this.load("@webiny/serverless-apollo-service");
        const output = await apolloService({
            plugins,
            env: {
                ...env,
                FILES_API_URL: get(files, "api.graphqlUrl"),
                I18N_API_URL: get(i18n, "api.graphqlUrl")
            },
            ...rest
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
