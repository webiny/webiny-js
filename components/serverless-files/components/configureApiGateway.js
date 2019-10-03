const ConfigureApiGateway = require("aws-sdk/clients/apigateway");

const DOWNLOAD_ENDPOINT_PATH = "/download/{path}";

const BINARY_MEDIA_TYPES = ["*/*"];

const isDownloadEndpoint = endpoint => endpoint.path === DOWNLOAD_ENDPOINT_PATH;

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
    const resourceId = apiGatewayOutput.endpoints.find(isDownloadEndpoint).id;

    try {
        await apiGatewayInstance
            .putIntegrationResponse({
                statusCode: "200",
                httpMethod: "GET",
                contentHandling: "CONVERT_TO_BINARY",
                restApiId,
                resourceId
            })
            .promise();

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
