const { join } = require("path");
const { Component } = require("@serverless/core");
const normalizeInputs = require("./utils/normalizeInputs");

/**
 * This component deploys:
 * - API GW
 * - One function:
 * - validatePAT - receives a Personal Access Token and returns essentialy user info
 */

class FilesComponent extends Component {
    async default(rawInputs = {}) {
        const inputs = normalizeInputs(rawInputs);

        const {
            region,
            functions: { apolloService: apolloServiceInputs }
        } = inputs;

        if (!apolloServiceInputs.plugins) {
            apolloServiceInputs.plugins = [];
        }

        const validatePATLambda = await this.load("@webiny/serverless-function", "validatePAT");
        await validatePATLambda({
            region,
            name: this.context.instance.getResourceName("validatePAT"),
            timeout: 10,
            code: join(__dirname, "functions/validatePAT"),
            handler: "handler.handler",
            description: `Used to validate incoming Personal Access Tokens.`,
            env: {
                MONGODB_NAME: inputs.env.MONGODB_NAME,
                MONGODB_SERVER: inputs.env.MONGODB_SERVER
            }
        });

        // Deploy graphql API
        const apolloService = await this.load("@webiny/serverless-apollo-service");
        const apolloServiceOutput = await apolloService({
            ...apolloServiceInputs,
            region,
            binaryMediaTypes: ["*/*"],
            env: {
                ...apolloServiceInputs.env,
                DEBUG: apolloServiceInputs.debug || "true",
                AUTHENTICATE_BY_PAT_FUNCTION_NAME: this.context.instance.getResourceName(
                    "validatePAT"
                )
            }
        });

        const output = {
            api: apolloServiceOutput.api,
            cdnOrigin: {
                url: apolloServiceOutput.api.url
            }
        };

        this.state.output = output;
        await this.save();

        return output;
    }

    async remove() {
        const apolloService = await this.load("@webiny/serverless-apollo-service");
        await apolloService.remove();

        const lambda = await this.load("@webiny/serverless-function", "validatePAT");
        await lambda.remove();

        // We do not remove S3 bucket; we want to avoid users accidentally deleting all of their files.
        this.context.instance.debug(`Skipping S3 bucket deletion, you must do this manually.`);
        this.state = {};
        await this.save();
    }
}

module.exports = FilesComponent;
