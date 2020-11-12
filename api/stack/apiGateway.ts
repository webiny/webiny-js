import * as aws from "@pulumi/aws";

class ApiGateway {
    api: aws.apigatewayv2.Api;
    defaultStage: aws.apigatewayv2.Stage;
    constructor({ routes }: { routes: Array<any> }) {
        this.api = new aws.apigatewayv2.Api("api-gateway", {
            protocolType: "HTTP",
            description: "Main API gateway"
        });

        this.defaultStage = new aws.apigatewayv2.Stage("default", {
            apiId: this.api.id,
            autoDeploy: true
        });

        for (let i = 0; i < routes.length; i++) {
            const route = routes[i];
            const integration = new aws.apigatewayv2.Integration(route.name, {
                description: "Apollo Gateway Integration",
                apiId: this.api.id,
                integrationType: "AWS_PROXY",
                integrationMethod: route.method,
                integrationUri: route.function.arn,
                passthroughBehavior: "WHEN_NO_MATCH"
            });

            new aws.apigatewayv2.Route(route.name, {
                apiId: this.api.id,
                routeKey: `${route.method} ${route.path}`,
                target: integration.id.apply(value => `integrations/${value}`)
            });

            new aws.lambda.Permission(`allow-${route.name}`, {
                action: "lambda:InvokeFunction",
                function: route.function.arn,
                principal: "apigateway.amazonaws.com",
                sourceArn: this.api.executionArn.apply(arn => `${arn}/*/*${route.path}`)
            });
        }
    }
}

export default ApiGateway;
