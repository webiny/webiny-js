import * as awsx from "@pulumi/awsx";

// TODO: change to HTTPS API!
class ApiGateway {
    gateway: awsx.apigateway.API;
    constructor({ routes }: { routes: Array<any> }) {
        this.gateway = new awsx.apigateway.API("api-gateway", {
            stageName: "default",
            routes,
            restApiArgs: {
                description: "Main API Gateway",
                binaryMediaTypes: ["*/*"],
                endpointConfiguration: {
                    types: "REGIONAL"
                }
            }
        });
    }
}

export default ApiGateway;
