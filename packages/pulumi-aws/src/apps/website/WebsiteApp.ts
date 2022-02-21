import * as aws from "@pulumi/aws";

import {
    defineApp,
    ApplicationContext,
    createGenericApplication,
    mergeAppHooks,
    ApplicationHooks
} from "@webiny/pulumi-sdk";

import { createAppBucket } from "../createAppBucket";
import { websiteUpload } from "./WebsiteHookUpload";
import { websiteRender } from "./WebsiteHookRender";
import { websiteUpdatePbSettings } from "./WebsiteHookUpdatePbSettings";

export interface WebsiteAppConfig extends Partial<ApplicationHooks> {
    config?(app: WebsiteApp, ctx: ApplicationContext): void;
}

export const WebsiteApp = defineApp({
    name: "Website",
    config(app) {
        const appBucket = createAppBucket(app, "app");

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

        const deliveryBucket = createAppBucket(app, "delivery");

        const deliveryCloudfront = app.addResource(aws.cloudfront.Distribution, {
            name: "delivery",
            config: {
                enabled: true,
                waitForDeployment: true,
                origins: [deliveryBucket.origin, appBucket.origin],
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
                        targetOriginId: deliveryBucket.origin.originId,
                        // MinTTL <= DefaultTTL <= MaxTTL
                        minTtl: 0,
                        defaultTtl: 2592000, // 30 days
                        maxTtl: 2592000
                    }
                ],
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

export function createWebsiteApp(config: WebsiteAppConfig) {
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
        app(ctx) {
            const app = new WebsiteApp(ctx);
            config.config?.(app, ctx);
            return app;
        },
        beforeBuild: config.beforeBuild,
        afterBuild: config.afterBuild,
        beforeDeploy: config.beforeDeploy,
        afterDeploy: mergeAppHooks(
            websiteUpload,
            websiteRender,
            websiteUpdatePbSettings,
            config.afterDeploy
        )
    });
}
