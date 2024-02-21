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
            name: "websocket-api",
            config: {
                protocolType: "WEBSOCKET",
                routeSelectionExpression: "$request.body.action"
            }
        });

        app.addResource(aws.lambda.Permission, {
            name: `websocket-api-permission`,
            config: {
                action: "lambda:InvokeFunction",
                function: graphql.functions.graphql.output.name,
                principal: "apigateway.amazonaws.com",
                sourceArn: websocketApi.output.executionArn.apply(arn => `${arn}/*/*`)
            }
        });

        const websocketApiIntegration = app.addResource(aws.apigatewayv2.Integration, {
            name: "websocket-api-integration",
            config: {
                apiId: websocketApi.output.id,
                integrationType: "AWS_PROXY",
                integrationUri: graphql.functions.graphql.output.invokeArn
            }
        });

        const websocketApiDefaultRoute = app.addResource(aws.apigatewayv2.Route, {
            name: "websocket-api-route-default",
            config: {
                apiId: websocketApi.output.id,
                routeKey: "$default",
                target: websocketApiIntegration.output.id.apply(value => `integrations/${value}`)
            }
        });

        const websocketApiConnectRoute = app.addResource(aws.apigatewayv2.Route, {
            name: "websocket-api-route-connect",
            config: {
                apiId: websocketApi.output.id,
                routeKey: "$connect",
                authorizationType: "NONE",
                target: websocketApiIntegration.output.id.apply(value => `integrations/${value}`)
            }
        });

        const websocketApiDisconnectRoute = app.addResource(aws.apigatewayv2.Route, {
            name: "websocket-api-route-disconnect",
            config: {
                apiId: websocketApi.output.id,
                routeKey: "$disconnect",
                authorizationType: "NONE",
                target: websocketApiIntegration.output.id.apply(value => `integrations/${value}`)
            }
        });

        const deployment = app.addResource(aws.apigatewayv2.Deployment, {
            name: "websocket-api-deployment",
            config: {
                apiId: websocketApi.output.id,
                description: "WebSocket API Deployment"
            },
            opts: {
                dependsOn: [
                    websocketApiDefaultRoute.output,
                    websocketApiConnectRoute.output,
                    websocketApiDisconnectRoute.output
                ]
            }
        });

        // Create an IAM role
        // This role will be used by API Gateway to push logs to CloudWatch
        const apiGatewayLoggingRole = app.addResource(aws.iam.Role, {
            name: "apiGatewayLoggingRole",
            config: {
                assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
                    Service: "apigateway.amazonaws.com"
                })
            }
        });

        app.addResource(aws.iam.RolePolicy, {
            name: "apiGatewayLoggingPolicy",
            config: {
                role: apiGatewayLoggingRole.output.id,
                policy: {
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Action: ["logs:*"],
                            Effect: "Allow",
                            Resource: "*"
                        }
                    ]
                }
            }
        });

        app.addResource(aws.apigateway.Account, {
            name: "apiGatewayAccount",
            config: {
                cloudwatchRoleArn: apiGatewayLoggingRole.output.arn
            }
        });

        // TODO remove when development is done
        const logGroup = app.addResource(aws.cloudwatch.LogGroup, {
            name: "websocket-api-log",
            config: {
                retentionInDays: 7
            }
        });

        const websocketApiStage = app.addResource(aws.apigatewayv2.Stage, {
            name: "websocket-api-stage",
            config: {
                apiId: websocketApi.output.id,
                deploymentId: deployment.output.id,
                name: app.params.run.env,
                defaultRouteSettings: {
                    loggingLevel: "INFO",
                    throttlingBurstLimit: 1000,
                    throttlingRateLimit: 500
                },
                // TODO remove when development is done
                accessLogSettings: {
                    destinationArn: logGroup.output.arn,
                    format: JSON.stringify({
                        requestId: "$context.requestId",
                        ip: "$context.identity.sourceIp",
                        caller: "$context.identity.caller",
                        user: "$context.identity.user",
                        requestTime: "$context.requestTime",
                        httpMethod: "$context.httpMethod",
                        resourcePath: "$context.resourcePath",
                        status: "$context.status",
                        protocol: "$context.protocol",
                        responseLength: "$context.responseLength"
                    })
                }
            }
        });

        return {
            websocketApi,
            websocketApiStage,
            websocketApiConnectRoute,
            websocketApiDisconnectRoute,
            websocketApiDefaultRoute,
            websocketApiUri: pulumi.interpolate`${websocketApi.output.apiEndpoint}/${websocketApiStage.output.name}`
        };
    }
});
