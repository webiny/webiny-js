import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

class SettingsManager {
    functions: {
        settings: aws.lambda.Function;
    };
    constructor({ role, dbProxy }: { role: aws.iam.Role; dbProxy: aws.lambda.Function }) {
        this.functions = {
            settings: new aws.lambda.Function("sm-get-settings", {
                runtime: "nodejs12.x",
                handler: "handler.handler",
                role: role.arn,
                timeout: 30,
                memorySize: 128,
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive("./code/settingsManager/build")
                }),
                environment: {
                    variables: { DB_PROXY_FUNCTION: dbProxy.arn }
                }
            })
        };
    }
}

export default SettingsManager;
