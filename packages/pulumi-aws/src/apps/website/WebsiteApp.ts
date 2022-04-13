import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import {
    defineApp,
    ApplicationContext,
    createGenericApplication,
    mergeAppHooks,
    ApplicationConfig
} from "@webiny/pulumi-sdk";

import { createPublicAppBucket } from "../createAppBucket";
import { websiteUpload } from "./WebsiteHookUpload";
import { websiteRender } from "./WebsiteHookRender";
import { applyCustomDomain, CustomDomainParams } from "../customDomain";
import { createPrerenderingService } from "./WebsitePrerendering";
import { getStorageOutput } from "../getStorageOutput";
import { getAwsAccountId } from "../awsUtils";

export interface WebsiteAppConfig {
    /** Custom domain configuration */
    domain?(ctx: ApplicationContext): CustomDomainParams;
}

export const WebsiteApp = defineApp({
    name: "Website",
    config(app, config: WebsiteAppConfig) {
        const storage = getStorageOutput(app);
        const awsAccountId = getAwsAccountId(app);

        const appBucket = createPublicAppBucket(app, "app");

        const appCloudfront = app.addResource(aws.cloudfront.Distribution, {
            name: "app",
            config: {
                enabled: true,
                waitForDeployment: true,
                origins: [appBucket.origin],
                defaultRootObject: "index.html",
                defaultCacheBehavior: {
                    compress: true,
                    targetOriginId: appBucket.origin.originId,
                    viewerProtocolPolicy: "redirect-to-https",
                    allowedMethods: ["GET", "HEAD", "OPTIONS"],
                    cachedMethods: ["GET", "HEAD", "OPTIONS"],
                    forwardedValues: {
                        cookies: { forward: "none" },
                        queryString: false
                    },
                    // MinTTL <= DefaultTTL <= MaxTTL
                    minTtl: 0,
                    defaultTtl: 0,
                    maxTtl: 0
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
            }
        });

        const deliveryBucket = createPublicAppBucket(app, "delivery");

        const deliveryCloudfront = app.addResource(aws.cloudfront.Distribution, {
            name: "delivery",
            config: {
                enabled: true,
                waitForDeployment: true,
                origins: [deliveryBucket.origin, appBucket.origin],
                defaultRootObject: "index.html",
                defaultCacheBehavior: {
                    compress: true,
                    targetOriginId: deliveryBucket.origin.originId,
                    viewerProtocolPolicy: "redirect-to-https",
                    allowedMethods: ["GET", "HEAD", "OPTIONS"],
                    cachedMethods: ["GET", "HEAD", "OPTIONS"],
                    originRequestPolicyId: "",
                    forwardedValues: {
                        cookies: { forward: "none" },
                        queryString: true
                    },
                    // MinTTL <= DefaultTTL <= MaxTTL
                    minTtl: 0,
                    defaultTtl: 30,
                    maxTtl: 30
                },
                orderedCacheBehaviors: [
                    {
                        compress: true,
                        allowedMethods: ["GET", "HEAD", "OPTIONS"],
                        cachedMethods: ["GET", "HEAD", "OPTIONS"],
                        forwardedValues: {
                            cookies: {
                                forward: "none"
                            },
                            headers: [],
                            queryString: false
                        },
                        pathPattern: "/static/*",
                        viewerProtocolPolicy: "allow-all",
                        targetOriginId: appBucket.origin.originId,
                        // MinTTL <= DefaultTTL <= MaxTTL
                        minTtl: 0,
                        defaultTtl: 2592000, // 30 days
                        maxTtl: 2592000
                    }
                ],
                customErrorResponses: [
                    {
                        errorCode: 404,
                        responseCode: 404,
                        responsePagePath: "/_NOT_FOUND_PAGE_/index.html"
                    }
                ],
                priceClass: "PriceClass_100",
                restrictions: {
                    geoRestriction: {
                        restrictionType: "none"
                    }
                },
                viewerCertificate: {
                    cloudfrontDefaultCertificate: true
                }
            }
        });

        const envVariables = {
            // Among other things, this determines the amount of information we reveal on runtime errors.
            // https://www.webiny.com/docs/how-to-guides/environment-variables/#debug-environment-variable
            DEBUG: String(process.env.DEBUG),
            DB_TABLE: storage.primaryDynamodbTableName,
            APP_URL: pulumi.interpolate`https://${appCloudfront.output.domainName}`,
            DELIVERY_BUCKET: deliveryBucket.bucket.output.bucket,
            DELIVERY_CLOUDFRONT: deliveryCloudfront.output.id,
            DELIVERY_URL: pulumi.interpolate`https://${deliveryCloudfront.output.domainName}`
        };

        const prerendering = createPrerenderingService(app, {
            awsAccountId,
            envVariables,
            primaryDynamodbTableArn: storage.primaryDynamodbTableArn,
            fileManagerBucketId: storage.fileManagerBucketId,
            eventBusArn: storage.eventBusArn
        });

        const domain = config.domain?.(app.ctx);
        if (domain) {
            applyCustomDomain(deliveryCloudfront, domain);
        }

        app.addOutputs({
            // Cloudfront and S3 bucket used to host the single-page application (SPA). The URL of the distribution is mainly
            // utilized by the Page Builder app's prerendering engine. Using this URL, it accesses the SPA and creates HTML snapshots.
            // The files that are generated in that process are stored in the `deliveryStorage` S3 bucket further below.
            appId: appCloudfront.output.id,
            appStorage: appBucket.bucket.output.id,
            appUrl: appCloudfront.output.domainName.apply(value => `https://${value}`),
            // These are the Cloudfront and S3 bucket that will deliver static pages to the actual website visitors.
            // The static HTML snapshots delivered from them still rely on the app's S3 bucket
            // defined above, for serving static assets (JS, CSS, images).
            deliveryId: deliveryCloudfront.output.id,
            deliveryStorage: deliveryBucket.bucket.output.id,
            deliveryUrl: deliveryCloudfront.output.domainName.apply(value => `https://${value}`)
        });

        return {
            prerendering,
            app: {
                ...appBucket,
                cloudfront: appCloudfront
            },
            delivery: {
                ...deliveryBucket,
                cloudfront: deliveryCloudfront
            }
        };
    }
});

export type WebsiteApp = InstanceType<typeof WebsiteApp>;

export function createWebsiteApp(config: WebsiteAppConfig & ApplicationConfig<WebsiteApp>) {
    return createGenericApplication({
        id: "website",
        name: "website",
        description: "Your project's public website.",
        cli: {
            // Default args for the "yarn webiny watch ..." command (we don't need deploy option while developing).
            watch: {
                deploy: false
            }
        },
        async app(ctx) {
            const app = new WebsiteApp(ctx);
            await app.setup(config);
            await config.config?.(app, ctx);
            return app;
        },
        beforeBuild: config.beforeBuild,
        afterBuild: config.afterBuild,
        beforeDeploy: config.beforeDeploy,
        afterDeploy: mergeAppHooks(websiteUpload, websiteRender, config.afterDeploy)
    });
}
