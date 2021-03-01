import * as path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import defaultLambdaRole from "./defaultLambdaRole";

//@ts-ignore
import { createInstallationZip } from "@webiny/api-page-builder/installation";

class PageBuilder {
    functions: {
        updateSettings: aws.lambda.Function;
    };
    constructor({ env, bucket }: { env: Record<string, any>; bucket: aws.s3.Bucket }) {
        const pbInstallationZipPath = path.join(path.resolve(), ".tmp", "pbInstallation.zip");

        createInstallationZip(pbInstallationZipPath);

        new aws.s3.BucketObject(
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

        const updateSettings = new aws.lambda.Function("pb-update-settings", {
            role: defaultLambdaRole.role.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 10,
            memorySize: 128,
            description:
                "Updates default Page Builder app's settings, e.g. website or prerendering URLs, default title, etc.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("../code/pageBuilder/updateSettings/build")
            }),
            environment: {
                variables: {
                    ...env
                }
            }
        });

        this.functions = {
            updateSettings
        };
    }
}

export default PageBuilder;
