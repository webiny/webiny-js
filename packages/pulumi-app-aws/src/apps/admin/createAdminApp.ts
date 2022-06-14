import * as aws from "@pulumi/aws";

import { createPulumiApp, PulumiApp } from "@webiny/pulumi-app";
import { tagResources } from "~/utils";
import { createPublicAppBucket } from "../createAppBucket";
import { applyCustomDomain, CustomDomainParams } from "../customDomain";

export interface CreateAdminAppConfig {
    /** Custom domain configuration */
    domain?(app: PulumiApp): CustomDomainParams | undefined | void;

    pulumi?: (app: ReturnType<typeof createApiPulumiApp>) => void;
}

export function createAdminApp(projectAppConfig: CreateAdminAppConfig = {}) {
    return {
        id: "admin",
        name: "Admin",
        description: "Your project's admin area.",
        cli: {
            // Default args for the "yarn webiny watch ..." command (we don't need deploy option while developing).
            watch: {
                deploy: false
            }
        },
        pulumi: createApiPulumiApp(projectAppConfig)
    };
}

const createApiPulumiApp = (projectAppConfig: CreateAdminAppConfig) => {
    const app = createPulumiApp({
        name: "admin",
        path: "apps/admin",
        config: projectAppConfig,
        program: async app => {
            const bucket = createPublicAppBucket(app, "admin-app");

            const cloudfront = app.addResource(aws.cloudfront.Distribution, {
                name: "admin-app-cdn",
                config: {
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
                }
            });

            const domain = projectAppConfig.domain?.(app);
            if (domain) {
                applyCustomDomain(cloudfront, domain);
            }

            app.addOutputs({
                appStorage: bucket.bucket.output.id,
                appDomain: cloudfront.output.domainName,
                appUrl: cloudfront.output.domainName.apply(value => `https://${value}`)
            });

            tagResources({
                WbyProjectName: String(process.env["WEBINY_PROJECT_NAME"]),
                WbyEnvironment: String(process.env["WEBINY_ENV"])
            });

            return {
                ...bucket,
                cloudfront
            };
        }
    });

    if (projectAppConfig.pulumi) {
        projectAppConfig.pulumi(app);
    }

    return app;
};
