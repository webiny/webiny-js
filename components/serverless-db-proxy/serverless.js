const { Component } = require("@serverless/core");
const get = require("lodash.get");

class DbProxyComponent extends Component {
    async default(inputs = {}) {
        const { env, region, concurrencyLimit, timeout } = inputs;

        const name =
            get(this.state, "output.name") ||
            this.context.instance.getResourceName(inputs.name);

        const proxyLambda = await this.load("@webiny/serverless-function");
        const proxyLambdaOutput = await proxyLambda({
            region,
            concurrencyLimit,
            name,
            timeout,
            code: __dirname,
            handler: "handler.handler",
            description: `Proxies DB commands.`,
            env
        });

        this.state.output = proxyLambdaOutput;
        await this.save();
        return proxyLambdaOutput;
    }

    async remove() {
        const lambda = await this.load("@webiny/serverless-function");
        await lambda.remove();

        this.state = {};
        await this.save();
    }
}

module.exports = DbProxyComponent;
