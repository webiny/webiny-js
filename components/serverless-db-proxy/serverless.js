const { Component } = require("@serverless/core");
const get = require("lodash.get");
const { MongoClient } = require("mongodb");

class DbProxyComponent extends Component {
    async default(inputs = {}) {
        const { env, region, concurrencyLimit, timeout, testConnectionBeforeDeploy } = inputs;

        if (testConnectionBeforeDeploy === true) {
            try {
                const connection = await MongoClient.connect(env.MONGODB_SERVER, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                    connectTimeoutMS: 5000,
                    socketTimeoutMS: 5000,
                    serverSelectionTimeoutMS: 5000
                });

                // Let's immediately close the connection so we don't end up with a zombie connection.
                await connection.close();
            } catch (e) {
                throw new Error(
                    `Could not connect to the MongoDB server, make sure the connection string is correct and that the database server allows outside connections. Check https://docs.webiny.com/docs/get-started/quick-start#3-setup-database-connection for more information.`
                );
            }
        }

        const name =
            get(this.state, "output.name") || this.context.instance.getResourceName(inputs.name);

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
