const AWS = require("aws-sdk");
const isEqual = require("lodash.isequal");
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
    endpointTypes: ["REGIONAL"],
    binaryMediaTypes: []
};

class AwsApiGateway extends Component {
    async default(inputs = {}) {
        try {
            if (isEqual(this.state.inputs, inputs)) {
                this.context.instance.debug("Input was not changed, no action required.");
                return this.state;
            } else {
                this.state.inputs = inputs;
            }

            this.context.status("Deploying");

            const config = { ...defaults, ...inputs };

            if (this.state.name) {
                config.name = this.state.name;
            } else {
                config.name = this.context.instance.getResourceName(config.name);
            }

            const { name, description, region, stage, endpointTypes, binaryMediaTypes } = config;

            this.context.instance.debug(
                `Starting API Gateway deployment with name %o in the %o region`,
                name,
                region
            );

            // quick fix for array of objects in yaml issue
            config.endpoints = Object.values(config.endpoints);

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
                this.context.instance.debug(`API ID not found in state. Creating a new API.`);
                apiId = await retry(() =>
                    createApi({ apig, name, description, endpointTypes, binaryMediaTypes })
                );
                this.context.instance.debug(`API with ID %o created.`, apiId);
                this.state.id = apiId;
                await this.save();
            } else if (!(await apiExists({ apig, apiId }))) {
                throw Error(`the specified api id "${apiId}" does not exist`);
            }

            this.context.instance.debug(
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

            this.context.instance.debug(`Deploying authorizers if any for API ID %o.`, apiId);

            endpoints = await createAuthorizers({ apig, lambda, apiId, endpoints });

            this.context.instance.debug(`Deploying paths/resources for API ID %o.`, apiId);

            endpoints = await createPaths({ apig, apiId, endpoints });

            this.context.instance.debug(`Deploying methods for API ID %o.`, apiId);

            endpoints = await createMethods({ apig, apiId, endpoints });

            this.context.instance.debug(
                `Sleeping for couple of seconds before creating method integration.`
            );

            // need to sleep for a bit between method and integration creation
            await utils.sleep(2000);

            this.context.instance.debug(
                `Creating integrations for the provided methods for API ID %o.`,
                apiId
            );

            endpoints = await createIntegrations({ apig, lambda, apiId, endpoints });

            this.context.instance.debug(`Removing any old endpoints for API ID ${apiId}.`);

            // keep endpoints in sync with provider
            await removeOutdatedEndpoints({
                apig,
                apiId,
                endpoints,
                stateEndpoints: this.state.endpoints || []
            });

            this.context.instance.debug(
                `Creating deployment for API ID %o in the %o stage and the %o region.`,
                apiId,
                stage,
                region
            );

            await retry(() => createDeployment({ apig, apiId, stage }));

            config.url = `https://${apiId}.execute-api.${region}.amazonaws.com/${stage}`;

            this.state.endpoints = endpoints;
            this.state.name = config.name;
            this.state.region = config.region;
            this.state.stage = config.stage;
            this.state.url = config.url;
            await this.save();

            this.context.instance.debug(
                `Deployment successful for the API named %o in the %o region.`,
                name,
                region
            );
            this.context.instance.debug(`API URL is %o.`, config.url);

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
            this.context.instance.debug(
                `API ID %o found in state. Removing from the %o.`,
                this.state.id,
                this.state.region
            );
            await retry(() => removeApi({ apig, apiId: this.state.id }));

            this.context.instance.debug(
                `API with ID %o was successfully removed from the %o region.`,
                this.state.id,
                this.state.region
            );
        } else if (inputs.id && this.state.endpoints && this.state.endpoints.length !== undefined) {
            this.context.instance.debug(`No API ID found in state.`);
            this.context.instance.debug(`Removing any previously deployed authorizers.`);

            await removeAuthorizers({ apig, apiId: inputs.id, endpoints: this.state.endpoints });

            this.context.instance.debug(`Removing any previously deployed methods.`);

            await removeMethods({ apig, apiId: inputs.id, endpoints: this.state.endpoints });

            this.context.instance.debug(`Removing any previously deployed resources.`);

            await removeResources({ apig, apiId: inputs.id, endpoints: this.state.endpoints });
        }

        const outputs = {
            name: this.state.name,
            id: this.state.id,
            endpoints: this.state.endpoints,
            url: this.state.url
        };

        this.context.instance.debug(`Flushing state for the API Gateway component.`);

        this.state = {};
        await this.save();

        return outputs;
    }
}

module.exports = AwsApiGateway;
