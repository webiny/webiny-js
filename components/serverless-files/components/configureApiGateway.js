const ConfigureApiGateway = require("aws-sdk/clients/apigateway");

const BINARY_MEDIA_TYPES = ["*/*"];

/**
 * Enables support for binary media types and conversion of base64-encoded
 * data (return from lambda function) to binary.
 * @param apiGatewayOutput
 * @returns {Promise<void>}
 */
module.exports = async apiGatewayOutput => {
    const apiGatewayInstance = new ConfigureApiGateway({
        region: "us-east-1"
    });

    const restApiId = apiGatewayOutput.id;

    try {
        await apiGatewayInstance
            .updateRestApi({
                restApiId,
                patchOperations: BINARY_MEDIA_TYPES.map(type => ({
                    op: "add",
                    path: "/binaryMediaTypes/" + type.replace("/", "~1")
                }))
            })
            .promise();
    } catch (e) {
        console.log("Woah!", e.message);
    }
};
