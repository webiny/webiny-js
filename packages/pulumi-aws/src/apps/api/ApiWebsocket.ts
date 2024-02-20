import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { createAppModule, PulumiApp, PulumiAppModule } from "@webiny/pulumi";
import { ApiGraphql } from "~/apps";

export type ApiWebsocket = PulumiAppModule<typeof ApiWebsocket>;

export const ApiWebsocket = createAppModule({
    name: "ApiWebsocket",
    config(app: PulumiApp) {
        const graphql = app.getModule(ApiGraphql);

        const websocketApi = app.addResource(aws.apigatewayv2.Api, {
            name: "websocketApi",
            config: {
                protocolType: "WEBSOCKET",
                routeSelectionExpression: "$request.body.action"
            }
        });

        const websocketApiIntegration = app.addResource(aws.apigatewayv2.Integration, {
            name: "websocketApiIntegration",
            config: {
                apiId: websocketApi.output.id,
                integrationType: "AWS_PROXY",
                integrationUri: graphql.functions.graphql.output.arn
            }
        });

        const websocketApiDefaultRoute = app.addResource(aws.apigatewayv2.Route, {
            name: "websocketApiRouteDefault",
            config: {
                apiId: websocketApi.output.id,
                routeKey: "$default",
                target: pulumi.interpolate`integrations/${websocketApiIntegration.output.id}`
            }
        });

        const websocketApiConnectRoute = app.addResource(aws.apigatewayv2.Route, {
            name: "websocketApiRouteConnect",
            config: {
                apiId: websocketApi.output.id,
                routeKey: "$connect",
                target: pulumi.interpolate`integrations/${websocketApiIntegration.output.id}`
            }
        });

        const websocketApiDisconnectRoute = app.addResource(aws.apigatewayv2.Route, {
            name: "websocketApiRouteDisconnect",
            config: {
                apiId: websocketApi.output.id,
                routeKey: "$disconnect",
                target: pulumi.interpolate`integrations/${websocketApiIntegration.output.id}`
            }
        });

        const deployment = app.addResource(aws.apigatewayv2.Deployment, {
            name: "websocketApiDeployment",
            config: {
                apiId: websocketApi.output.id
            }
        });

        const websocketApiStage = app.addResource(aws.apigatewayv2.Stage, {
            name: "websocketApiStage",
            config: {
                apiId: websocketApi.output.id,
                deploymentId: deployment.output.id,
                name: app.params.run.env,
                autoDeploy: true
            }
        });

        return {
            websocketApi,
            websocketApiStage,
            websocketApiConnectRoute,
            websocketApiDisconnectRoute,
            websocketApiDefaultRoute,
            websocketApiUri: pulumi.interpolate`wss://${websocketApi.output.apiEndpoint}/${websocketApiStage.output.name}`
        };
    }
});
