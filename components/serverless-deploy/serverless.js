const { Component } = require("@serverless/core");
const { green } = require("chalk");

const getAlias = inputs => {
    const type = inputs.apps ? "apps" : "api";
    return `${type}.${inputs.env}`;
};

class Deploy extends Component {
    async default(inputs = {}) {
        if (inputs.help) {
            require("./help");
            process.exit(0);
        }

        console.log(`☕️️ If this is your first deploy, it may take a few minutes.`);
        if (!inputs.debug) {
            console.log(
                `Hint: to see what's happening, add ${green(
                    "--debug"
                )} flag next time you run the deploy.`
            );
        }

        const alias = getAlias(inputs);

        const template = await this.load("@webiny/serverless-template", alias);
        const output = await template(inputs);

        if (inputs.api) {
            console.log(`\n🏁 Done! Here are some resources you will need to run your client apps:`);
            console.log(`----------`);

            if (output.cdn) {
                console.log(`🚀 GraphQL API URL: ${green(output.cdn.url + "/graphql")}`);
            }
            if (output.cognito) {
                console.log(`🔐 Cognito user pool ID: ${green(output.cognito.userPool.Id)}`);
                output.cognito.appClients.forEach(client => {
                    console.log(
                        `🔑 ${green(client.ClientName)} user pool client ID: ${green(client.ClientId)}`
                    );
                });
            }
        }
    }

    async remove(inputs = {}) {
        const alias = getAlias(inputs);

        const template = await this.load("@webiny/serverless-template", alias);
        await template.remove(inputs);
    }
}

module.exports = Deploy;
