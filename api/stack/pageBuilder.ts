import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import vpc from "./vpc";
import defaultLambdaRole from "./defaultLambdaRole";

class PageBuilder {
    bucket: aws.s3.Bucket;
    functions: {
        queue: aws.lambda.Function;
        render: aws.lambda.Function;
    };
    constructor() {
        this.bucket = new aws.s3.Bucket("pb-pages", {
            forceDestroy: true,
            acl: "private",
            corsRules: [
                {
                    allowedHeaders: ["*"],
                    allowedMethods: ["POST", "GET"],
                    allowedOrigins: ["*"],
                    maxAgeSeconds: 3000
                }
            ]
        });

        const render = new aws.lambda.Function("pb-render", {
            role: defaultLambdaRole.role.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 360,
            memorySize: 2048,
            description: "Renders pages and stores output in an S3 bucket.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/pageBuilder/render/build")
            }),
            environment: {
                variables: { STORAGE_NAME: this.bucket.id }
            },
            vpcConfig: {
                subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
            }
        });

        const queue = new aws.lambda.Function("pb-queue", {
            role: defaultLambdaRole.role.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 360,
            memorySize: 1024,
            description: "Process pages queued for rendering.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/pageBuilder/queue/build")
            }),
            environment: {
                variables: { STORAGE_NAME: this.bucket.id }
            },
            vpcConfig: {
                subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
            }
        });

        this.functions = {
            render,
            queue
        };
    }
}

export default PageBuilder;
