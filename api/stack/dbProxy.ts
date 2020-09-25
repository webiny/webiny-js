import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import vpc from "./vpc";
import defaultLambdaRole from "./defaultLambdaRole";

class DbProxy {
    function: aws.lambda.Function;
    constructor() {
        this.function = new aws.lambda.Function("db-proxy", {
            runtime: "nodejs12.x",
            handler: "handler.handler",
            role: defaultLambdaRole.role.arn,
            timeout: 30,
            memorySize: 512,
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/databaseProxy/build")
            }),
            environment: {
                variables: {
                    MONGODB_SERVER: String(process.env.MONGODB_SERVER),
                    MONGODB_NAME: String(process.env.MONGODB_NAME)
                }
            },
            vpcConfig: {
                subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
            },
        });
    }
}

export default DbProxy;
