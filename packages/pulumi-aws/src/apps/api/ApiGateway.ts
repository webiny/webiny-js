import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { defineAppModule, PulumiApp, PulumiAppModule } from "@webiny/pulumi-sdk";

export interface ApiRouteParams {
    path: pulumi.Input<string>;
    method: pulumi.Input<string>;
    function: pulumi.Input<string>;
}

export type ApiGateway = PulumiAppModule<typeof ApiGateway>;

export const ApiGateway = defineAppModule({
    name: "ApiGateway",
    config(app: PulumiApp, routesConfig: Record<string, ApiRouteParams>) {
        const api = app.addResource(aws.apigatewayv2.Api, {
            name: "api-gateway",
            config: {
                protocolType: "HTTP",
                description: "Main API gateway"
            }
        });

        const stage = app.addResource(aws.apigatewayv2.Stage, {
            name: "default",
            config: {
                apiId: api.output.id,
                autoDeploy: true
            }
        });

        const routes: Record<string, ReturnType<typeof createRoute>> = {};

        for (const name of Object.keys(routesConfig)) {
            addRoute(name, routesConfig[name]);
        }

        return {
            api,
            stage,
            routes,
            addRoute
        };

        function addRoute(name: string, params: ApiRouteParams) {
            const route = createRoute(app, api.output, name, params);
            routes[name] = route;
        }
    }
});

function createRoute(
    app: PulumiApp,
    api: pulumi.Output<aws.apigatewayv2.Api>,
    name: string,
    params: ApiRouteParams
) {
    const integration = app.addResource(aws.apigatewayv2.Integration, {
        name: name,
        config: {
            description: "GraphQL API Integration",
            apiId: api.id,
            integrationType: "AWS_PROXY",
            integrationMethod: params.method,
            integrationUri: params.function,
            passthroughBehavior: "WHEN_NO_MATCH"
        }
    });

    const route = app.addResource(aws.apigatewayv2.Route, {
        name: name,
        config: {
            apiId: api.id,
            routeKey: `${params.method} ${params.path}`,
            target: integration.output.id.apply(value => `integrations/${value}`)
        }
    });

    const permission = app.addResource(aws.lambda.Permission, {
        name: `allow-${name}`,
        config: {
            action: "lambda:InvokeFunction",
            function: params.function,
            principal: "apigateway.amazonaws.com",
            sourceArn: api.executionArn.apply(arn => `${arn}/*/*${params.path}`)
        }
    });

    return {
        integration,
        route,
        permission
    };
}
