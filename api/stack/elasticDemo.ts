import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import vpc from "./vpc";
import defaultLambdaRole from "./defaultLambdaRole";

class ElasticDemo {
    functions: {
        graphql: aws.lambda.Function;
    };
    constructor({ env }: { env: { graphql: { [key: string]: any } } }) {
        this.functions = {
            graphql: new aws.lambda.Function("elastic-graphql", {
                runtime: "nodejs12.x",
                handler: "handler.handler",
                role: defaultLambdaRole.role.arn,
                timeout: 30,
                memorySize: 512,
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive("./code/elasticDemo/build")
                }),
                environment: {
                    variables: {
                        ...env.graphql
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

export default ElasticDemo;
