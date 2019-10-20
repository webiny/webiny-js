const { green } = require("chalk");
const execute = require("./execute");

module.exports = async inputs => {
    const { what } = inputs;
    const output = await execute(inputs);

    if (what === "api") {
        console.log(`\n🎉 Done! Here are some resources you will need to run your client apps:`);
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
};
