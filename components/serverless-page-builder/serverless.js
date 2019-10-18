const { join } = require("path");
const { Component } = require("@serverless/core");
const loadJson = require("load-json-file");

const getDeps = async deps => {
    const { dependencies } = await loadJson(join(__dirname, "package.json"));
    return deps.reduce((acc, item) => {
        acc[item] = dependencies[item];
        return acc;
    }, {});
};

class ServerlessPageBuilder extends Component {
    async default(inputs = {}) {
        const { plugins = [], ...rest } = inputs;

        plugins.unshift("@webiny/api-page-builder/plugins");

        // Deploy graphql API
        const apolloService = await this.load("@webiny/serverless-apollo-service");
        const output = await apolloService({
            plugins,
            ...rest,
            dependencies: await getDeps(["@webiny/api-page-builder"])
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

module.exports = ServerlessPageBuilder;
