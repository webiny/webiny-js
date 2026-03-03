import * as aws from "@pulumi/aws";
import { createAppModule, type PulumiApp, type PulumiAppModule } from "@webiny/pulumi";

export type CoreFileManger = PulumiAppModule<typeof CoreFileManger>;

export const CoreFileManger = createAppModule({
    name: "FileManagerBucket",
    config(app: PulumiApp, params: { protect: boolean }) {
        const name = "fm-bucket";

        const bucket = app.addResource(aws.s3.Bucket, {
            name,
            config: {
                // We definitely don't want to force-destroy if "protected" flag is true.
                forceDestroy: !params.protect
            },
            opts: {
                protect: params.protect
            }
        });

        const bucketAcl = app.addResource(aws.s3.BucketAcl, {
            name: `${name}-acl`,
            config: {
                bucket: bucket.output.id,
                acl: aws.s3.CannedAcl.Private
            }
        });

        // We need these rules to be able to upload to this bucket from the browser.
        const bucketCorsConfiguration = app.addResource(aws.s3.BucketCorsConfiguration, {
            name: `${name}-cors`,
            config: {
                bucket: bucket.output.id,
                corsRules: [
                    {
                        allowedHeaders: ["*"],
                        allowedMethods: ["POST", "GET", "PUT"],
                        allowedOrigins: ["*"],
                        maxAgeSeconds: 3000
                    }
                ]
            }
        });

        // Block any public access
        const blockPublicAccessBlock = app.addResource(aws.s3.BucketPublicAccessBlock, {
            name: `${name}-block-public-access`,
            config: {
                bucket: bucket.output.id,
                blockPublicAcls: true,
                blockPublicPolicy: true,
                ignorePublicAcls: true,
                restrictPublicBuckets: true
            }
        });

        return {
            bucket,
            bucketAcl,
            blockPublicAccessBlock,
            bucketCorsConfiguration
        };
    }
});
