const { Component } = require("@serverless/core");
const { trackComponent } = require("@webiny/tracking");

const component = "@webiny/serverless-api-gateway";

class ServerlessApiGateway extends Component {
    async default({ track, ...inputs } = {}) {
        await trackComponent({ track, context: this.context, component });

        const gw = await this.load("@serverless/api");

        return await gw(inputs);
    }

    async remove({ track, ...inputs } = {}) {
        await trackComponent({ track, context: this.context, component });
        const gw = await this.load("@serverless/api");
        return await gw.remove(inputs);
    }
}

module.exports = ServerlessApiGateway;
