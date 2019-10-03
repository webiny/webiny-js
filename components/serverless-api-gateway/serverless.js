const { Component } = require("@serverless/core");
const tracking = require("@webiny/serverless-component-tracking");

const component = "@webiny/serverless-api-gateway";

class ServerlessApiGateway extends Component {
    async default({ track, ...inputs } = {}) {
        if (track !== false) {
            await tracking({ context: this.context, component });
        }

        const gw = await this.load("@serverless/api", "gateway");

        return await gw(inputs);
    }

    async remove(inputs = {}) {
        const gw = await this.load("@serverless/api", "gateway");
        return await gw.remove(inputs);
    }
}

module.exports = ServerlessApiGateway;
