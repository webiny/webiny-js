const { Component } = require("@serverless/core");

class ServerlessApiGateway extends Component {
    async default(inputs = {}) {
        const gw = await this.load("@serverless/api");
        const output = await gw(inputs);

        this.state.output = output;
        await this.save();

        return output;
    }

    async remove(inputs = {}) {
        const gw = await this.load("@serverless/api");
        await gw.remove(inputs);

        this.state = {};
        await this.save();
    }
}

module.exports = ServerlessApiGateway;
