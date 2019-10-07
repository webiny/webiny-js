const { Component } = require("@serverless/core");
const { trackComponent } = require("@webiny/tracking");

const component = "@webiny/serverless-page-builder";

class ServerlessPageBuilder extends Component {
    async default({ track, ...inputs } = {}) {
        await trackComponent({ track, context: this.context, component });

        const { plugins = [], ...rest } = inputs;

        plugins.unshift("@webiny/api-page-builder/plugins");

        // Deploy graphql API
        const apolloService = await this.load("@webiny/serverless-apollo-service");
        const output = await apolloService({
            plugins,
            ...rest,
            track: false,
            dependencies: ["@webiny/api-page-builder"]
        });

        this.state.output = output;
        await this.save();

        return output;
    }

    async remove({ track, ...inputs } = {}) {
        await trackComponent({ track, context: this.context, component, method: "remove" });

        const apolloService = await this.load("@webiny/serverless-apollo-service");
        return await apolloService.remove({ ...inputs, track: false });
    }
}

module.exports = ServerlessPageBuilder;
