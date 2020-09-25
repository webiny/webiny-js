import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import vpc from "./vpc";
import defaultLambdaRole from "./defaultLambdaRole";

class SettingsManager {
    functions: {
        settings: aws.lambda.Function;
    };
    constructor({ dbProxy }: { dbProxy: aws.lambda.Function }) {
        this.functions = {
            settings: new aws.lambda.Function("sm-get-settings", {
                runtime: "nodejs12.x",
                handler: "handler.handler",
                role: defaultLambdaRole.role.arn,
                timeout: 30,
                memorySize: 128,
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive("./code/settingsManager/build")
                }),
                environment: {
                    variables: { DB_PROXY_FUNCTION: dbProxy.arn }
                },
                vpcConfig: {
                    subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                    securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
                }
            })
        };
    }
}

export default SettingsManager;
