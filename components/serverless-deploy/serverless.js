const { Component } = require("@serverless/core");

const getAlias = inputs => {
    const type = inputs.apps ? "apps" : "api";
    return `${type}.${inputs.env}`;
};

class Deploy extends Component {
    async default(inputs = {}) {
        const alias = getAlias(inputs);

        const template = await this.load("@webiny/serverless-template", alias);
        const output = await template(inputs);

        // TODO: add user-friendly messaging
        if (inputs.api) {
            if (output.cdn) {
                console.log(`Your API URL is ${output.cdn.url}`);
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
