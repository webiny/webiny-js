const { Component } = require("@serverless/core");

class Project extends Component {
    async default(inputs = {}) {
        const template = await this.load("@webiny/serverless-deploy");
        return await template(inputs);
    }

    async remove(inputs = {}) {
        const template = await this.load("@webiny/serverless-deploy");
        await template.remove(inputs);
    }
}

module.exports = Project;
