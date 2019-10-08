const ApiGw = require("aws-sdk/clients/apigateway");
const pRetry = require("p-retry");
const PRETRY_ARGS = { retries: 3 };
const get = require("lodash.get");
const set = require("lodash.set");

/**
 * Enables support for binary media types and conversion of base64-encoded
 * data (return from lambda function) to binary.
 * @param region
 * @param apiGatewayOutput
 * @param component
 * @returns {Promise<void>}
 */
module.exports = async ({ region, apiGatewayOutput, component }) => {
    const apiGw = new ApiGw({ region });

    const { id: restApiId } = apiGatewayOutput;

    let path = "state.apiGateway.binaryMediaTypes";
    if (!get(component, path)) {
        set(component, path, [
            {
                op: "add",
                path: "/binaryMediaTypes/*~1*"
            }
        ]);

        await pRetry(
            () =>
                apiGw
                    .updateRestApi({
                        restApiId,
                        patchOperations: get(component, path)
                    })
                    .promise(),
            PRETRY_ARGS
        );

        await pRetry(
            () =>
                apiGw
                    .createDeployment({
                        restApiId,
                        stageName: "prod",
                        stageDescription: "Updated binary media types."
                    })
                    .promise(),
            PRETRY_ARGS
        );

        await component.save();
        component.context.debug(
            `[Webiny] Saved state for serverless-files component: 
                updated binary media types on the API Gateway.`
        );
    }
};
