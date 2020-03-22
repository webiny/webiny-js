const { Component } = require("@serverless/core");
const pick = require("lodash.pick");
const get = require("lodash.get");

const getInputs = ({ component, inputs }) => {
    const output = {
        api: {
            description: `API for ${component.context.instance.alias}`,
            stage: "prod",
            region: "us-east-1",
            graphqlPath: "/graphql",
            endpoints: [],
            endpointTypes: ["REGIONAL"],
            binaryMediaTypes: [],
            ...pick(inputs, [
                "description",
                "stage",
                "region",
                "endpoints",
                "graphqlPath",
                "endpoints",
                "endpointTypes",
                "binaryMediaTypes"
            ])
        },
        function: null
    };

    const name =
        get(component.state, "output.graphql.name") ||
        component.context.instance.getResourceName(output.name || "graphql");

    output.function = {
        env: {},
        memory: 512,
        timeout: 10,
        code: null,
        root: inputs.function.code,
        handler: "handler.handler",
        description: `GraphQL server for ${component.context.instance.alias}.`,
        region: output.region,
        ...inputs.function,
        name
    };

    return output;
};

class ApolloService extends Component {
    async default(rawInputs = {}) {
        const inputs = getInputs({ component: this, inputs: rawInputs });
        this.state.inputs = inputs;
        await this.save();

        // Deploy lambda
        const lambda = await this.load("@webiny/serverless-function");
        const apiGw = await this.load("@webiny/serverless-api-gateway");

        this.context.instance.debug("Deploy lambda");
        const lambdaOut = await lambda(inputs.function);

        this.context.instance.debug(`Deploying API Gateway`);
        const apiGwOut = await apiGw({
            ...inputs.api,
            endpoints: [
                ...inputs.api.endpoints,
                { path: inputs.api.graphqlPath, method: "ANY", function: lambdaOut.arn }
            ]
        });

        this.context.instance.debug("Finished API Gateway deployment: %o", apiGwOut.url);

        const output = {
            api: { ...apiGwOut, graphqlUrl: apiGwOut.url + inputs.api.graphqlPath },
            graphql: lambdaOut
        };

        this.state.output = output;
        await this.save();

        return output;
    }

    async remove(inputs = {}) {
        const apiGw = await this.load("@webiny/serverless-api-gateway");
        await apiGw.remove(inputs);

        const lambda = await this.load("@webiny/serverless-function");
        await lambda.remove(inputs);

        this.state = {};
        await this.save();
    }
}

module.exports = ApolloService;
