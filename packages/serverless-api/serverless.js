const { Component } = require("@serverless/core");

class WebinyApi extends Component {
    async default(inputs = {}) {
        const api = await this.load("@serverless/api");
        const outputs = await api(inputs);

        if (inputs.domain) {
            const domain = await this.load("@serverless/domain");
            const subdomain = inputs.domain.split(".")[0];
            const secondLevelDomain = inputs.domain.replace(`${subdomain}.`, "");

            const domainInputs = {
                domain: secondLevelDomain,
                subdomains: {}
            };

            domainInputs.subdomains[subdomain] = { url: outputs.url };
            const domainOutputs = await domain(domainInputs);

            outputs.domain = domainOutputs.domains[0];
            this.state.domain = outputs.domain;
            await this.save();
        }

        return outputs;
    }
}

module.exports = WebinyApi;