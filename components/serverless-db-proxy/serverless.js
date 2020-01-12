const { Component } = require("@serverless/core");

class DbProxyComponent extends Component {
    async default(inputs = {}) {
        const { env, region, concurrencyLimit } = inputs;

        const proxyLambda = await this.load("@webiny/serverless-function", "db-proxy");
        const proxyLambdaOutput = await proxyLambda({
            region,
            concurrencyLimit,
            name: "Database Proxy",
            timeout: 15,
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
        const lambda = await this.load("@webiny/serverless-function", "db-proxy");
        await lambda.remove();

        this.state = {};
        await this.save();
    }
}

module.exports = DbProxyComponent;
