const AWS = require("aws-sdk");
const { Component, utils } = require("@serverless/core");

const {
    apiExists,
    createApi,
    validateEndpoints,
    createAuthorizers,
    createPaths,
    createMethods,
    createIntegrations,
    createDeployment,
    removeApi,
    removeMethods,
    removeAuthorizers,
    removeResources,
    removeOutdatedEndpoints,
    retry
} = require("./utils");

const defaults = {
    region: "us-east-1",
    stage: "prod",
    description: "Serverless Components API",
    endpointTypes: ["REGIONAL"]
};

class AwsApiGateway extends Component {
    async default(inputs = {}) {
        try {
            this.context.status("Deploying");

            const config = { ...defaults, ...inputs };

            config.name = this.state.name || this.context.resourceId();

            const { name, description, region, stage, endpointTypes } = config;

            this.context.debug(
                `Starting API Gateway deployment with name ${name} in the ${region} region`
            );

            // todo quick fix for array of objects in yaml issue
            config.endpoints = Object.keys(config.endpoints).map(e => config.endpoints[e]);

            const apig = new AWS.APIGateway({
                region,
                credentials: this.context.credentials.aws
            });

            const lambda = new AWS.Lambda({
                region: config.region,
                credentials: this.context.credentials.aws
            });

            let apiId = this.state.id || config.id;

            if (!apiId) {
                this.context.debug(`API ID not found in state. Creating a new API.`);
                apiId = await retry(() => createApi({ apig, name, description, endpointTypes }));
                this.context.debug(`API with ID ${apiId} created.`);
                this.state.id = apiId;
                await this.save();
            } else if (!(await apiExists({ apig, apiId }))) {
                throw Error(`the specified api id "${apiId}" does not exist`);
            }

            this.context.debug(
                `Validating ownership for the provided endpoints for API ID ${apiId}.`
            );

            let endpoints = await validateEndpoints({
                apig,
                apiId,
                endpoints: config.endpoints,
                state: this.state,
                stage,
                region
            });

            this.context.debug(`Deploying authorizers if any for API ID ${apiId}.`);

            endpoints = await createAuthorizers({ apig, lambda, apiId, endpoints });

            this.context.debug(`Deploying paths/resources for API ID ${apiId}.`);

            endpoints = await createPaths({ apig, apiId, endpoints });

            this.context.debug(`Deploying methods for API ID ${apiId}.`);

            endpoints = await createMethods({ apig, apiId, endpoints });

            this.context.debug(
                `Sleeping for couple of seconds before creating method integration.`
            );

            // need to sleep for a bit between method and integration creation
            await utils.sleep(2000);

            this.context.debug(
                `Creating integrations for the provided methods for API ID ${apiId}.`
            );

            endpoints = await createIntegrations({ apig, lambda, apiId, endpoints });

            this.context.debug(`Removing any old endpoints for API ID ${apiId}.`);

            // keep endpoints in sync with provider
            await removeOutdatedEndpoints({
                apig,
                apiId,
                endpoints,
                stateEndpoints: this.state.endpoints || []
            });

            this.context.debug(
                `Creating deployment for API ID ${apiId} in the ${stage} stage and the ${region} region.`
            );

            await retry(() => createDeployment({ apig, apiId, stage }));

            config.url = `https://${apiId}.execute-api.${region}.amazonaws.com/${stage}`;

            this.state.endpoints = endpoints;
            this.state.name = config.name;
            this.state.region = config.region;
            this.state.stage = config.stage;
            this.state.url = config.url;
            await this.save();

            this.context.debug(
                `Deployment successful for the API named ${name} in the ${region} region.`
            );
            this.context.debug(`API URL is ${config.url}.`);

            const outputs = {
                name: config.name,
                id: apiId,
                endpoints,
                url: config.url
            };

            return outputs;
        } catch (err) {
            console.log("Error deploying API GATEWAY", inputs);
            console.log(err);
            throw err;
        }
    }

    async remove(inputs = {}) {
        this.context.status("Removing");

        const apig = new AWS.APIGateway({
            region: this.state.region || defaults.region,
            credentials: this.context.credentials.aws
        });

        if (this.state.id) {
            this.context.debug(
                `API ID ${this.state.id} found in state. Removing from the ${this.state.region}.`
            );
            await removeApi({ apig, apiId: this.state.id });

            this.context.debug(
                `API with ID ${this.state.id} was successfully removed from the ${this.state.region} region.`
            );
        } else if (inputs.id && this.state.endpoints && this.state.endpoints.length !== undefined) {
            this.context.debug(`No API ID found in state.`);
            this.context.debug(`Removing any previously deployed authorizers.`);

            await removeAuthorizers({ apig, apiId: inputs.id, endpoints: this.state.endpoints });

            this.context.debug(`Removing any previously deployed methods.`);

            await removeMethods({ apig, apiId: inputs.id, endpoints: this.state.endpoints });

            this.context.debug(`Removing any previously deployed resources.`);

            await removeResources({ apig, apiId: inputs.id, endpoints: this.state.endpoints });
        }

        const outputs = {
            name: this.state.name,
            id: this.state.id,
            endpoints: this.state.endpoints,
            url: this.state.url
        };

        this.context.debug(`Flushing state for the API Gateway component.`);

        this.state = {};
        await this.save();

        return outputs;
    }
}

module.exports = AwsApiGateway;
