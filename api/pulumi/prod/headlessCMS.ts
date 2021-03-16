import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import vpc from "./vpc";

class HeadlessCMS {
    functions: {
        graphql: aws.lambda.Function;
    };
    role: aws.iam.Role;
    policy: aws.iam.RolePolicyAttachment;
    constructor({ env }: { env: Record<string, any> }) {
        this.role = new aws.iam.Role("headless-cms-lambda-role", {
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
        });

        this.policy = new aws.iam.RolePolicyAttachment("headless-cms-lambda-role-policy", {
            role: this.role,
            policyArn: "arn:aws:iam::aws:policy/AdministratorAccess"
        });

        this.functions = {
            graphql: new aws.lambda.Function("headless-cms", {
                runtime: "nodejs12.x",
                handler: "handler.handler",
                role: this.role.arn,
                timeout: 30,
                memorySize: 512,
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive("../code/headlessCMS/build")
                }),
                environment: {
                    variables: {
                        ...env,
                        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1"
                    }
                },
                vpcConfig: {
                    subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                    securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
                }
            })
        };
    }
}

export default HeadlessCMS;
