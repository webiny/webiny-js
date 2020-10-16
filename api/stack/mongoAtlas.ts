import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import defaultLambdaRole from "./defaultLambdaRole";

class MongoAtlas {
    databaseProxy: aws.lambda.Function;
    constructor() {
        this.databaseProxy = new aws.lambda.Function("db-proxy", {
            runtime: "nodejs12.x",
            handler: "handler.handler",
            role: defaultLambdaRole.role.arn,
            timeout: 30,
            memorySize: 512,
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/mongoAtlasProxy/build")
            }),
            environment: {
                variables: {
                    MONGODB_SERVER: String(process.env.MONGODB_SERVER),
                    MONGODB_NAME: String(process.env.MONGODB_NAME),
                    LOG_COLLECTION: String(true)
                }
            }
        });
    }
}

export default MongoAtlas;
