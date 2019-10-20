const { Component } = require("@serverless/core");

const defaults = {
    stage: "prod",
    endpointTypes: ["REGIONAL"]
};

class ServerlessApiGateway extends Component {
    async default(inputs = {}) {
        inputs.endpoints = Object.values(inputs.endpoints);

        const config = Object.assign({}, defaults, inputs);

        // Normalize inputs to only include function ARN
        if (config.endpoints.length !== 0) {
            config.endpoints = config.endpoints.map(endpoint => {
                let functionArn = endpoint.function;
                if (typeof endpoint.function === "object") {
                    functionArn = endpoint.function.arn;
                }
                return {
                    ...endpoint,
                    function: functionArn,
                    authorizer: endpoint.authorizer ? endpoint.authorizer.arn : null
                };
            });
        }

        const gw = await this.load("@webiny/serverless-aws-api-gateway");
        const output = await gw(config);

        this.state.output = output;
        await this.save();

        return output;
    }

    async remove(inputs = {}) {
        const config = Object.assign({}, defaults, inputs);

        const gw = await this.load("@webiny/serverless-aws-api-gateway");
        await gw.remove(config);

        this.state = {};
        await this.save();
    }
}

module.exports = ServerlessApiGateway;
