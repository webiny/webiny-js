import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as path from "path";
import vpc from "./vpc";
import defaultLambdaRole from "./defaultLambdaRole";

// @ts-ignore
import { createInstallationZip } from "@webiny/api-page-builder/installation";

class PageBuilder {
    functions: {
        graphql: aws.lambda.Function;
    };
    constructor({
        fileManagerFunction,
        bucket,
        env
    }: {
        fileManagerFunction: aws.lambda.Function;
        bucket: aws.s3.Bucket;
        env: { graphql: { [key: string]: string } };
    }) {
        const pbInstallationZipPath = path.join(__dirname, "pbInstallation.zip");
        createInstallationZip(pbInstallationZipPath);

        const pbInstallationZip = new aws.s3.BucketObject(
            "./pbInstallation.zip",
            {
                key: "pbInstallation.zip",
                acl: "public-read",
                bucket: bucket,
                contentType: "application/octet-stream",
                source: new pulumi.asset.FileAsset(pbInstallationZipPath)
            },
            {
                parent: bucket
            }
        );

        this.functions = {
            graphql: new aws.lambda.Function("pb-graphql", {
                runtime: "nodejs12.x",
                handler: "handler.handler",
                role: defaultLambdaRole.role.arn,
                timeout: 30,
                memorySize: 512,
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive("./code/pageBuilder/build")
                }),
                environment: {
                    variables: {
                        ...env.graphql,
                        INSTALLATION_S3_BUCKET: bucket.id,
                        INSTALLATION_FILES_ZIP_KEY: pbInstallationZip.key,
                        FILE_MANAGER_FUNCTION: fileManagerFunction.arn
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

export default PageBuilder;
