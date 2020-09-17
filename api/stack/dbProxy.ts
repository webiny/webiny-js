import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

class DbProxy {
    function: aws.lambda.Function;
    constructor({ role }: { role: aws.iam.Role }) {
        this.function = new aws.lambda.Function("db-proxy", {
            runtime: "nodejs12.x",
            handler: "handler.handler",
            role: role.arn,
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
            }
        });
    }
}

export default DbProxy;
