import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { createPulumiApp, PulumiAppParamCallback, PulumiAppParam } from "@webiny/pulumi";
import { createPublicAppBucket } from "../createAppBucket";
import { applyCustomDomain, CustomDomainParams } from "../customDomain";
import { createPrerenderingService } from "./WebsitePrerendering";
import { CoreOutput, VpcConfig } from "../common";
import { tagResources } from "~/utils";
import { applyTenantRouter } from "~/apps/tenantRouter";

export interface CreateWebsiteAppParams {
    /** Custom domain configuration */
    domain?: PulumiAppParamCallback<CustomDomainParams>;

    /**
     * Enables or disables VPC for the API.
     * For VPC to work you also have to enable it in the `core` application.
     */
    vpc?: PulumiAppParam<boolean | undefined>;

    /**
     * Provides a way to adjust existing Pulumi code (cloud infrastructure resources)
     * or add additional ones into the mix.
     */
    pulumi?: (app: ReturnType<typeof createWebsitePulumiApp>) => void;
}

export const createWebsitePulumiApp = (projectAppParams: CreateWebsiteAppParams = {}) => {
    const app = createPulumiApp({
        name: "website",
        path: "apps/website",
        config: projectAppParams,
        program: async app => {
            // Register core output as a module available for all other modules
            const core = app.addModule(CoreOutput);

            // Register VPC config module to be available to other modules
            app.addModule(VpcConfig, {
                enabled: app.getParam(projectAppParams.vpc)
            });

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

            const prerendering = createPrerenderingService(app, {
                env: {
                    DB_TABLE: core.primaryDynamodbTableName,
                    DB_TABLE_ELASTICSEARCH: pulumi.interpolate`${core.elasticsearchDynamodbTableName}`,
                    APP_URL: pulumi.interpolate`https://${appCloudfront.output.domainName}`,
                    DELIVERY_BUCKET: deliveryBucket.bucket.output.bucket,
                    DELIVERY_CLOUDFRONT: deliveryCloudfront.output.id,
                    DELIVERY_URL: pulumi.interpolate`https://${deliveryCloudfront.output.domainName}`
                }
            });

            const domain = app.getParam(projectAppParams.domain);
            if (domain) {
                applyCustomDomain(deliveryCloudfront, domain);
            }

            if (process.env.WEBINY_MULTI_TENANCY === "true") {
                applyTenantRouter(app, deliveryCloudfront);
            }

            app.addOutputs({
                // Cloudfront and S3 bucket used to host the single-page application (SPA). The URL of the distribution is mainly
                // utilized by the Page Builder app's prerendering engine. Using this URL, it accesses the SPA and creates HTML snapshots.
                // The files that are generated in that process are stored in the `deliveryStorage` S3 bucket further below.
                appId: appCloudfront.output.id,
                appStorage: appBucket.bucket.output.id,
                appUrl: appCloudfront.output.domainName.apply(value => `https://${value}`),
                appDomain: appCloudfront.output.domainName,
                // These are the Cloudfront and S3 bucket that will deliver static pages to the actual website visitors.
                // The static HTML snapshots delivered from them still rely on the app's S3 bucket
                // defined above, for serving static assets (JS, CSS, images).
                deliveryId: deliveryCloudfront.output.id,
                deliveryStorage: deliveryBucket.bucket.output.id,
                deliveryDomain: deliveryCloudfront.output.domainName,
                deliveryUrl: deliveryCloudfront.output.domainName.apply(value => `https://${value}`)
            });

            tagResources({
                WbyProjectName: String(process.env["WEBINY_PROJECT_NAME"]),
                WbyEnvironment: String(process.env["WEBINY_ENV"])
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

    if (projectAppParams.pulumi) {
        projectAppParams.pulumi(app);
    }

    return app;
};
