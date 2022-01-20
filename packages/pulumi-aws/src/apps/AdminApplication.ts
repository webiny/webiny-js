import * as aws from "@pulumi/aws";
import { tagResources } from "@webiny/cli-plugin-deploy-pulumi/utils";

import { CloudFrontBucket } from "../components/CloudFrontBucket";
import { ResourceOverride } from "../createResource";
import { ApplicationConfig } from "./ApplicationConfig";
import { createGenericApplication } from "./GenericApplication";

export interface AdminApplicationConfig extends ApplicationConfig {
    resources?: AdminApplicationResources;
}

export interface AdminApplicationResources {
    bucket?: ResourceOverride<typeof aws.s3.Bucket>;
}

export function createAdminApplication(config: AdminApplicationConfig) {
    return createGenericApplication({
        id: config.id,
        name: config.name,
        description: config.description,
        cli: config.cli,
        beforeBuild: config.beforeBuild,
        afterBuild: config.afterBuild,
        beforeDeploy: config.beforeDeploy,
        afterDeploy: config.afterDeploy,
        pulumiProgram: async () => {
            // Add tags to all resources that support tagging.
            tagResources({
                WbyProjectName: String(process.env.WEBINY_PROJECT_NAME),
                WbyEnvironment: String(process.env.WEBINY_ENV)
            });

            const bucket = new CloudFrontBucket("admin-app", {
                bucketConfig: config.resources?.bucket
            });

            const cloudfront = new aws.cloudfront.Distribution("admin-app-cdn", {
                enabled: true,
                waitForDeployment: false,
                origins: [bucket.origin],
                defaultRootObject: "index.html",
                defaultCacheBehavior: {
                    compress: true,
                    targetOriginId: bucket.origin.originId,
                    viewerProtocolPolicy: "redirect-to-https",
                    allowedMethods: ["GET", "HEAD", "OPTIONS"],
                    cachedMethods: ["GET", "HEAD", "OPTIONS"],
                    forwardedValues: {
                        cookies: { forward: "none" },
                        queryString: false
                    },
                    // MinTTL <= DefaultTTL <= MaxTTL
                    minTtl: 0,
                    defaultTtl: 600,
                    maxTtl: 600
                },
                priceClass: "PriceClass_100",
                customErrorResponses: [
                    { errorCode: 404, responseCode: 404, responsePagePath: "/index.html" }
                ],
                restrictions: {
                    geoRestriction: {
                        restrictionType: "none"
                    }
                },
                viewerCertificate: {
                    cloudfrontDefaultCertificate: true
                }
            });

            return {
                appStorage: bucket.s3Bucket.id,
                appUrl: cloudfront.domainName.apply(value => `https://${value}`)
            };
        }
    });
}
