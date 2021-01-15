import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import defaultLambdaRole from "./defaultLambdaRole";

class PageBuilder {
    functions: {
        updateSettings: aws.lambda.Function;
    };
    constructor({ dbTable }: { dbTable: aws.dynamodb.Table }) {
        const updateSettings = new aws.lambda.Function("pb-update-settings", {
            role: defaultLambdaRole.role.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 10,
            memorySize: 128,
            description:
                "Updates default Page Builder app's settings, e.g. website or prerendering URLs, default title, etc.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/pageBuilder/updateSettings/build")
            }),
            environment: {
                variables: {
                    DB_TABLE: dbTable.name
                }
            }
        });

        this.functions = {
            updateSettings
        };
    }
}

export default PageBuilder;
