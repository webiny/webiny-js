import * as aws from "@pulumi/aws";
import { createAppModule, PulumiApp, PulumiAppModule } from "@webiny/pulumi";
import { LAMBDA_RUNTIME } from "~/constants";
import * as pulumi from "@pulumi/pulumi";
import path from "path";
import { CoreVpc } from "~/apps";

export interface WatchCommandParams {
    deploymentId: boolean;
}

export const WatchCommand = createAppModule({
    name: "WatchCommand",
    config(app: PulumiApp, params: WatchCommandParams) {

        const roleName = "iot-authorizer-lambda-role";

        const role = app.addResource(aws.iam.Role, {
            name: roleName,
            config: {
                assumeRolePolicy: {
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Action: "sts:AssumeRole",
                            Principal: {
                                Service: "lambda.amazonaws.com"
                            },
                            Effect: "Allow"
                        }
                    ]
                }
            },
            meta: { isLambdaFunctionRole: true }
        });

        const vpc = app.getModule(CoreVpc, { optional: true });

        // Only use `AWSLambdaVPCAccessExecutionRole` policy if VPC feature is enabled.
        if (vpc) {
            app.addResource(aws.iam.RolePolicyAttachment, {
                name: `${roleName}-AWSLambdaVPCAccessExecutionRole`,
                config: {
                    role: role.output,
                    policyArn: aws.iam.ManagedPolicy.AWSLambdaVPCAccessExecutionRole
                }
            });
        } else {
            app.addResource(aws.iam.RolePolicyAttachment, {
                name: `${roleName}-AWSLambdaBasicExecutionRole`,
                config: {
                    role: role.output,
                    policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
                }
            });
        }

        const iotAuthorizerFunction = app.addResource(aws.lambda.Function, {
            name: "watch-command-iot-authorizer",
            config: {
                role: role.output.arn,
                runtime: LAMBDA_RUNTIME,
                handler: "handler.handler",
                timeout: 1,
                memorySize: 128,
                description: "Authorizes 'webiny watch' command communication.",
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive(
                        path.join(__dirname, "webinyWatchCommand")
                    )
                }),
                environment: {
                    variables: {
                        WEBINY_WATCH_COMMAND_TOPIC: `webiny-watch-${params.deploymentId}`,
                    }
                },
                vpcConfig: vpc
                    ? {
                          subnetIds: vpc.subnets.private.map(s => s.output.id),
                          securityGroupIds: [vpc.vpc.output.defaultSecurityGroupId]
                      }
                    : undefined
            }
        });

        app.addResource(aws.lambda.Permission, {
            name: "webiny-watch-iot-authorizer",
            config: {
                action: "lambda:InvokeFunction",
                function: iotAuthorizerFunction.output.arn,
                principal: "iot.amazonaws.com",
                sourceArn: "arn:aws:iot:eu-central-1:674320871285:authorizer/Authorizer"
            }
        });

        app.addResource(aws.iot.Authorizer, {
            name: "watch-command-iot-authorizer",
            config: {
                name: "example",
                authorizerFunctionArn: iotAuthorizerFunction.output.arn,
                status: "ACTIVE"
            }
        });

        return {};
    }
});
