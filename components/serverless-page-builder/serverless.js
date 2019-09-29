const { Component } = require("@serverless/core");

class PageBuilder extends Component {
    async default(inputs = {}) {
        const { plugins = [], ...rest } = inputs;

        plugins.unshift("@webiny/api-page-builder/plugins");

        // Deploy graphql API
        const apolloService = await this.load("@webiny/serverless-apollo-service");
        const output = await apolloService({ plugins, ...rest });

        this.state.output = output;
        await this.save();

        return output;
    }

    async remove(inputs = {}) {
        const apolloService = await this.load("@webiny/serverless-apollo-service");
        return await apolloService.remove(inputs);
    }

    async install(inputs = {}) {
        console.log("Installing....");
    }
}

module.exports = PageBuilder;
