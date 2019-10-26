const path = require("path");
const { Component } = require("@serverless/core");

class ServerlessApp extends Component {
    async default(inputs = {}) {
        if (!inputs.code) {
            inputs.code = path.join(inputs.root, "build");
        }

        if (!inputs.handler) {
            inputs.handler = "handler.handler";
        }

        const fn = await this.load("@webiny/serverless-function");

        const output = await fn({
            ...inputs,
            description: `serverless-app: ${inputs.description}`
        });

        this.state.output = output;
        await this.save();

        return output;
    }

    async remove(inputs = {}) {
        const fn = await this.load("@webiny/serverless-function");
        await fn.remove(inputs);

        this.state = {};
        await this.save();
    }
}

module.exports = ServerlessApp;
