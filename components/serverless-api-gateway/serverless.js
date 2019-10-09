const { Component } = require("@serverless/core");
const { trackComponent } = require("@webiny/tracking");

class ServerlessApiGateway extends Component {
    async default({ track, ...inputs } = {}) {
        await trackComponent({
            track,
            context: this.context,
            component: __dirname
        });

        const gw = await this.load("@serverless/api");
        const output = await gw(inputs);

        this.state.output = output;
        await this.save();

        return output;
    }

    async remove({ track, ...inputs } = {}) {
        await trackComponent({ track, context: this.context, component: __dirname });
        const gw = await this.load("@serverless/api");
        await gw.remove(inputs);

        this.state = {};
        await this.save();
    }
}

module.exports = ServerlessApiGateway;
