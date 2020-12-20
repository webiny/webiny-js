import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import vpc from "./vpc";
import defaultLambdaRole from "./defaultLambdaRole";

// @ts-ignore
import { getLayerArn } from "@webiny/aws-layers";

class PageBuilder {
    functions: {
        render: aws.lambda.Function;
    };
    constructor({ dbTable }: { dbTable: aws.dynamodb.Table }) {
        const render = new aws.lambda.Function("pb-render", {
            role: defaultLambdaRole.role.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 30,
            memorySize: 2048,
            layers: [
                getLayerArn("shelf-io-chrome-aws-lambda-layer", String(process.env.AWS_REGION))
            ],
            description: "Renders pages and stores output in an S3 bucket of choice.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/pageBuilder/render/build")
            }),
            vpcConfig: {
                subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
            }
        });

        this.functions = {
            render
        };
    }
}

export default PageBuilder;
