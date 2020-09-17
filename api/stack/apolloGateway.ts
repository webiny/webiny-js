import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

class ApolloGateway {
    functions: { gateway: aws.lambda.Function };
    constructor({ role, env }: { role: aws.iam.Role; env: { [key: string]: any } }) {
        this.functions = {
            gateway: new aws.lambda.Function("apollo-gateway", {
                runtime: "nodejs12.x",
                handler: "handler.handler",
                role: role.arn,
                timeout: 30,
                memorySize: 512,
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive("./code/apolloGateway/build")
                }),
                environment: {
                    variables: env
                }
            })
        };
    }
}

export default ApolloGateway;
