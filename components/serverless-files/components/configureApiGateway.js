const ApiGw = require("aws-sdk/clients/apigateway");
const pRetry = require("p-retry");

const BINARY_MEDIA_TYPES = ["*/*"];
const PRETRY_ARGS = { retries: 3 };

/**
 * Enables support for binary media types and conversion of base64-encoded
 * data (return from lambda function) to binary.
 * @param apiGatewayOutput
 * @returns {Promise<void>}
 */
module.exports = async apiGatewayOutput => {
    const apiGw = new ApiGw({
        region: "us-east-1"
    });

    const restApiId = apiGatewayOutput.id;

    const apiGatewayResponse = await pRetry(
        () => apiGw.getRestApi({ restApiId }).promise(),
        PRETRY_ARGS
    );

    if (
        Array.isArray(apiGatewayResponse.binaryMediaTypes) &&
        apiGatewayResponse.binaryMediaTypes.includes("*/*")
    ) {
        return;
    }

    await pRetry(
        () =>
            apiGw
                .updateRestApi({
                    restApiId,
                    patchOperations: BINARY_MEDIA_TYPES.map(type => ({
                        op: "add",
                        path: "/binaryMediaTypes/" + type.replace("/", "~1")
                    }))
                })
                .promise(),
        PRETRY_ARGS
    );

    return pRetry(
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
};
