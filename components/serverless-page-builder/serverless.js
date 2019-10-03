const { Component } = require("@serverless/core");
const tracking = require("@webiny/serverless-component-tracking");

const component = "@webiny/serverless-page-builder";

class ServerlessPageBuilder extends Component {
    async default({ track, ...inputs } = {}) {
        await tracking({ track, context: this.context, component });

        const { plugins = [], ...rest } = inputs;

        plugins.unshift("@webiny/api-page-builder/plugins");

        // Deploy graphql API
        const apolloService = await this.load("@webiny/serverless-apollo-service");
        const output = await apolloService({ plugins, ...rest, track: false });

        this.state.output = output;
        await this.save();

        return output;
    }

    async remove({ track, ...inputs } = {}) {
        await tracking({ track, context: this.context, component, method: "remove" });

        const apolloService = await this.load("@webiny/serverless-apollo-service");
        return await apolloService.remove({ ...inputs, track: false });
    }
}

module.exports = ServerlessPageBuilder;
