const { Component } = require("@serverless/core");
const { trackComponent } = require("@webiny/tracking");

class ServerlessAwsCloudfront extends Component {
    async default({ track, ...inputs } = {}) {
        await trackComponent({ track, context: this.context, component: __dirname });

        const cf = await this.load("@serverless/aws-cloudfront");
        const output = await cf(inputs);

        this.state.output = output;
        await this.save();

        return output;
    }

    async remove({ track, ...inputs } = {}) {
        await trackComponent({
            track,
            context: this.context,
            component: __dirname,
            method: "remove"
        });

        const cf = await this.load("@serverless/aws-cloudfront");
        await cf.remove(inputs);

        this.state = {};
        await this.save();
    }
}

module.exports = ServerlessAwsCloudfront;
