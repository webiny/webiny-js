import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import vpc from "./vpc";
import defaultLambdaRole from "./defaultLambdaRole";

class GraphQLPlayground {
    function: aws.lambda.Function;
    constructor() {
        this.function = new aws.lambda.Function("graphql-playground", {
            runtime: "nodejs12.x",
            handler: "handler.handler",
            role: defaultLambdaRole.role.arn,
            timeout: 30,
            memorySize: 128,
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/graphqlPlayground/build")
            }),
            vpcConfig: {
                subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
            }
        });
    }
}

export default GraphQLPlayground;
