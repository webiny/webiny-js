const { Component } = require("@serverless/core");

class ServerlessAwsCloudfront extends Component {
    async default(inputs = {}) {
        const cf = await this.load("@serverless/aws-cloudfront");
        const output = await cf(inputs);

        this.state.output = output;
        await this.save();

        return output;
    }

    async remove(inputs = {}) {
        const cf = await this.load("@serverless/aws-cloudfront");
        await cf.remove(inputs);

        this.state = {};
        await this.save();
    }
}

module.exports = ServerlessAwsCloudfront;
