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

        const bucketOwnershipControls = app.addResource(aws.s3.BucketOwnershipControls, {
            name: `${name}-ownership-controls`,
            config: {
                bucket: bucket.output.id,
                rule: {
                    objectOwnership: "BucketOwnerPreferred"
                }
            }
        });

        const bucketAcl = app.addResource(aws.s3.BucketAcl, {
            name: `${name}-acl`,
            config: {
                bucket: bucket.output.id,
                acl: aws.s3.CannedAcl.Private
            },
            opts: {
                dependsOn: [bucketOwnershipControls.output]
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

        /**
         * Expire transient working data.
         *
         * Theme extraction writes page screenshots under `theme-extraction/`. They are not user files
         * and never appear in the media library — they exist so a retry after a failed AI call can
         * reuse a crawl without re-reading somebody else's website. Nothing in the application can
         * safely delete them on completion (the crawl cache still references them), so retention
         * belongs here.
         *
         * Kept in step with `CRAWL_CACHE_MAX_AGE_DAYS` in `@webiny/api-theme-extraction`, which
         * refuses to reuse a crawl older than this — so a cache entry can never outlive the images it
         * points at. If you change one, change the other.
         */
        const bucketLifecycleConfiguration = app.addResource(aws.s3.BucketLifecycleConfiguration, {
            name: `${name}-lifecycle`,
            config: {
                bucket: bucket.output.id,
                rules: [
                    {
                        id: "expire-theme-extraction-screenshots",
                        status: "Enabled",
                        filter: {
                            prefix: "theme-extraction/"
                        },
                        expiration: {
                            days: 7
                        },
                        // Multipart uploads are not used for these, but an interrupted one would
                        // otherwise linger indefinitely and is invisible in the console.
                        abortIncompleteMultipartUpload: {
                            daysAfterInitiation: 1
                        }
                    }
                ]
            }
        });

        return {
            bucket,
            bucketOwnershipControls,
            bucketAcl,
            blockPublicAccessBlock,
            bucketCorsConfiguration,
            bucketLifecycleConfiguration
        };
    }
});
