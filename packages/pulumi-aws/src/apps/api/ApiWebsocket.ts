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

        const websocketLambdaPermission = app.addResource(aws.lambda.Permission, {
            name: `websocket-api-ws-to-lambda-permission`,
            config: {
                action: "lambda:InvokeFunction",
                function: graphql.functions.graphql.output.name,
                principal: "apigateway.amazonaws.com",
                sourceArn: websocketApi.output.executionArn.apply(arn => `${arn}/*`)
            }
        });

        const lambdaWebsocketPolicy = app.addResource(aws.iam.Policy, {
            name: "websocket-api-lambda-policy",
            config: {
                policy: {
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Action: "execute-api:ManageConnections",
                            Resource: [
                                websocketApi.output.arn,
                                websocketApi.output.executionArn,
                                websocketApi.output.arn.apply(arn => `${arn}/*`),
                                websocketApi.output.executionArn.apply(arn => `${arn}/*`)
                            ],
                            Sid: "PermissionForWebsocket"
                        }
                    ]
                }
            }
        });

        const lambdaWebsocketRolePolicyAttachment = app.addResource(aws.iam.RolePolicyAttachment, {
            name: "websocket-api-lambda-role-policy-attachment",
            config: {
                policyArn: lambdaWebsocketPolicy.output.arn,
                role: graphql.role.output
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

        const websocketApiStage = app.addResource(aws.apigatewayv2.Stage, {
            name: "websocket-api-stage",
            config: {
                apiId: websocketApi.output.id,
                autoDeploy: true,
                name: app.params.run.env,
                defaultRouteSettings: {
                    // Only enable when debugging. Note that by default, API Gateway does not
                    // have the required permissions to write logs to CloudWatch logs. More:
                    // https://coady.tech/aws-cloudwatch-logs-arn/
                    // loggingLevel: "INFO",
                    throttlingBurstLimit: 1000,
                    throttlingRateLimit: 500
                }
            }
        });

        return {
            websocketApi,
            websocketApiStage,
            websocketApiConnectRoute,
            websocketApiDisconnectRoute,
            websocketApiDefaultRoute,
            websocketLambdaPermission,
            lambdaWebsocketPolicy,
            lambdaWebsocketRolePolicyAttachment,
            websocketApiUrl: pulumi.interpolate`${websocketApi.output.apiEndpoint}/${websocketApiStage.output.name}`
        };
    }
});
