import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as path from "path";
// @ts-ignore
import { createInstallationZip } from "@webiny/api-page-builder/installation";

class PageBuilder {
    functions: {
        graphql: aws.lambda.Function;
    };
    constructor({
        bucket,
        role,
        env
    }: {
        bucket: aws.s3.Bucket;
        role: aws.iam.Role;
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
                role: role.arn,
                timeout: 30,
                memorySize: 512,
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive("./code/pageBuilder/build")
                }),
                environment: {
                    variables: {
                        ...env.graphql,
                        INSTALLATION_S3_BUCKET: bucket.id,
                        INSTALLATION_FILES_ZIP_KEY: pbInstallationZip.key
                    }
                }
            })
        };
    }
}

export default PageBuilder;
