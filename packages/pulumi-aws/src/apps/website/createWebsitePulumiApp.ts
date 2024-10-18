import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import fs from "fs";
import { createPulumiApp, PulumiAppParamCallback, PulumiAppParam } from "@webiny/pulumi";
import { createPrivateAppBucket } from "../createAppBucket";
import { applyCustomDomain, CustomDomainParams } from "../customDomain";
import { createPrerenderingService } from "./WebsitePrerendering";
import { CoreOutput, ApiOutput, VpcConfig } from "~/apps";
import { addDomainsUrlsOutputs, tagResources, withCommonLambdaEnvVariables } from "~/utils";
import { applyTenantRouter } from "~/apps/tenantRouter";
import { withServiceManifest } from "~/utils/withServiceManifest";
import { DEFAULT_PROD_ENV_NAMES } from "~/constants";

export type WebsitePulumiApp = ReturnType<typeof createWebsitePulumiApp>;

export interface CreateWebsitePulumiAppParams {
    /**
     * Custom domain(s) configuration.
     */
    domains?: PulumiAppParamCallback<CustomDomainParams>;

    /**
     * Custom preview domain(s) configuration.
     */
    previewDomains?: PulumiAppParamCallback<CustomDomainParams>;

    /**
     * Enables or disables VPC for the API.
     * For VPC to work you also have to enable it in the `core` application.
     */
    vpc?: PulumiAppParam<boolean | undefined>;

    /**
     * Provides a way to adjust existing Pulumi code (cloud infrastructure resources)
     * or add additional ones into the mix.
     */
    pulumi?: (app: WebsitePulumiApp) => void | Promise<void>;

    /**
     * Prefixes names of all Pulumi cloud infrastructure resource with given prefix.
     */
    pulumiResourceNamePrefix?: PulumiAppParam<string>;

    /**
     * Treats provided environments as production environments, which
     * are deployed in production deployment mode.
     * https://www.webiny.com/docs/architecture/deployment-modes/production
     */
    productionEnvironments?: PulumiAppParam<string[]>;
}

export const createWebsitePulumiApp = (projectAppParams: CreateWebsitePulumiAppParams = {}) => {
    const baseApp = createPulumiApp({
        name: "website",
        path: "apps/website",
        config: projectAppParams,
        program: async app => {
            const pulumiResourceNamePrefix = app.getParam(
                projectAppParams.pulumiResourceNamePrefix
            );
            if (pulumiResourceNamePrefix) {
                app.onResource(resource => {
                    if (!resource.name.startsWith(pulumiResourceNamePrefix)) {
                        resource.name = `${pulumiResourceNamePrefix}${resource.name}`;
                    }
                });
            }

            // Overrides must be applied via a handler, registered at the very start of the program.
            // By doing this, we're ensuring user's adjustments are not applied to late.
            if (projectAppParams.pulumi) {
                app.addHandler(() => {
                    return projectAppParams.pulumi!(app as WebsitePulumiApp);
                });
            }

            const productionEnvironments =
                app.params.create.productionEnvironments || DEFAULT_PROD_ENV_NAMES;
            const isProduction = productionEnvironments.includes(app.params.run.env);

            // Register core and api output as a module, to be available to all other modules.
            const core = app.addModule(CoreOutput);
            app.addModule(ApiOutput);

            // Register VPC config module to be available to other modules.
            const vpcEnabled = app.getParam(projectAppParams?.vpc) ?? isProduction;
            app.addModule(VpcConfig, { enabled: vpcEnabled });

            const appBucket = createPrivateAppBucket(app, "app");

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

            const deliveryBucket = createPrivateAppBucket(app, "delivery");

            /**
             * We need to have a Cloudfront Function to perform a simple request rewrite, so the request always includes
             * an "/index.html". This is necessary because our buckets are not "website" buckets, and we need to
             * have an exact object key when requesting page paths.
             */
            const viewerRequest = app.addResource(aws.cloudfront.Function, {
                name: "cfViewerRequest",
                config: {
                    runtime: "cloudfront-js-1.0",
                    publish: true,
                    code: fs.readFileSync(__dirname + `/deliveryViewerRequest.js`, "utf8")
                }
            });

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
                        maxTtl: 30,
                        functionAssociations: [
                            { functionArn: viewerRequest.output.arn, eventType: "viewer-request" }
                        ]
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
                        },
                        // This forward is necessary for non-WCP projects. For WCP projects, the
                        // forwarding is performed by the `website-router` Lambda@Edge function.
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
                            pathPattern: "/robots.txt",
                            viewerProtocolPolicy: "allow-all",
                            targetOriginId: appBucket.origin.originId
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
                dbTableName: core.primaryDynamodbTableName,
                dbTableHashKey: core.primaryDynamodbTableHashKey,
                dbTableRangeKey: core.primaryDynamodbTableRangeKey,
                appUrl: pulumi.interpolate`https://${appCloudfront.output.domainName}`,
                deliveryUrl: pulumi.interpolate`https://${deliveryCloudfront.output.domainName}`,
                bucket: deliveryBucket.bucket.output.bucket,
                cloudfrontId: deliveryCloudfront.output.id
            });

            const domains = app.getParam(projectAppParams.domains);
            if (domains) {
                applyCustomDomain(deliveryCloudfront, domains);
            }

            const previewDomains = app.getParam(projectAppParams.previewDomains);
            if (previewDomains) {
                applyCustomDomain(appCloudfront, previewDomains);
            }

            if (
                process.env.WCP_PROJECT_ENVIRONMENT ||
                process.env.WEBINY_MULTI_TENANCY === "true"
            ) {
                const { originLambda } = applyTenantRouter(app, deliveryCloudfront);

                app.addHandler(() => {
                    app.addOutputs({
                        websiteRouterOriginRequestFunction: originLambda.output.name
                    });
                });
            }

            app.addOutputs({
                // Cloudfront and S3 bucket used to host the single-page application (SPA). The URL of the distribution is mainly
                // utilized by the Page Builder app's prerendering engine. Using this URL, it accesses the SPA and creates HTML snapshots.
                // The files that are generated in that process are stored in the `deliveryStorage` S3 bucket further below.
                appId: appCloudfront.output.id,
                appStorage: appBucket.bucket.output.id,

                // These are the Cloudfront and S3 bucket that will deliver static pages to the actual website visitors.
                // The static HTML snapshots delivered from them still rely on the app's S3 bucket
                // defined above, for serving static assets (JS, CSS, images).
                deliveryId: deliveryCloudfront.output.id,
                deliveryStorage: deliveryBucket.bucket.output.id
            });

            app.addHandler(() => {
                addDomainsUrlsOutputs({
                    app,
                    cloudfrontDistribution: appCloudfront,
                    map: {
                        distributionDomain: "cloudfrontAppDomain",
                        distributionUrl: "cloudfrontAppUrl",
                        usedDomain: "appDomain",
                        usedUrl: "appUrl"
                    }
                });

                addDomainsUrlsOutputs({
                    app,
                    cloudfrontDistribution: deliveryCloudfront,
                    map: {
                        distributionDomain: "cloudfrontDeliveryDomain",
                        distributionUrl: "cloudfrontDeliveryUrl",
                        usedDomain: "deliveryDomain",
                        usedUrl: "deliveryUrl"
                    }
                });
            });

            tagResources({
                WbyProjectName: String(process.env["WEBINY_PROJECT_NAME"]),
                WbyEnvironment: String(process.env["WEBINY_ENV"])
            });

            return {
                prerendering,

                // "preview" and "app" are the same.
                // We introduced "preview" just because it's the word we use when talking about
                // Page Builder and "previewing" pages. In other words, the "preview" property
                // contains all resources related to serving page previews, unlike "delivery",
                // which is used to serve published pages to actual website visitors.
                // The "app" property was still left here just for backwards compatibility.
                preview: {
                    ...appBucket,
                    cloudfront: appCloudfront
                },
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

    const app = withServiceManifest(withCommonLambdaEnvVariables(baseApp));

    app.addHandler(() => {
        const preview = baseApp.resources.preview;
        const delivery = baseApp.resources.delivery;

        app.addServiceManifest({
            name: "website",
            manifest: {
                preview: {
                    cloudfront: {
                        distributionId: preview.cloudfront.output.id,
                        domainName: preview.cloudfront.output.domainName
                    },
                    bucket: {
                        name: preview.bucket.output.id,
                        arn: preview.bucket.output.arn,
                        bucketDomainName: preview.bucket.output.bucketDomainName,
                        bucketRegionalDomainName: preview.bucket.output.bucketRegionalDomainName
                    }
                },
                delivery: {
                    cloudfront: {
                        distributionId: delivery.cloudfront.output.id,
                        domainName: delivery.cloudfront.output.domainName
                    },
                    bucket: {
                        name: delivery.bucket.output.id,
                        arn: delivery.bucket.output.arn,
                        bucketDomainName: delivery.bucket.output.bucketDomainName,
                        bucketRegionalDomainName: delivery.bucket.output.bucketRegionalDomainName
                    }
                }
            }
        });
    });

    return app;
};
