import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import vpc from "./vpc";
import defaultLambdaRole from "./defaultLambdaRole";

class ApolloGateway {
    functions: { gateway: aws.lambda.Function };
    constructor({ env }: { env: { [key: string]: any } }) {
        this.functions = {
            gateway: new aws.lambda.Function("apollo-gateway", {
                runtime: "nodejs12.x",
                handler: "handler.handler",
                role: defaultLambdaRole.role.arn,
                timeout: 30,
                memorySize: 512,
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive("./code/apolloGateway/build")
                }),
                environment: {
                    variables: env
                },
                vpcConfig: {
                    subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                    securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
                }
            })
        };
    }
}

export default ApolloGateway;
