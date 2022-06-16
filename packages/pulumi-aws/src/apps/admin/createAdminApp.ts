import * as aws from "@pulumi/aws";

import { createPulumiApp, PulumiAppInputCallback } from "@webiny/pulumi";
import { tagResources } from "~/utils";
import { createPublicAppBucket } from "../createAppBucket";
import { applyCustomDomain, CustomDomainParams } from "../customDomain";

export interface CreateAdminAppParams {
    /** Custom domain configuration */
    domain?: PulumiAppInputCallback<CustomDomainParams>;

    /**
     * Provides a way to adjust existing Pulumi code (cloud infrastructure resources)
     * or add additional ones into the mix.
     */
    pulumi?: (app: ReturnType<typeof createAdminPulumiApp>) => void;
}

export function createAdminApp(projectAppParams: CreateAdminAppParams = {}) {
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
        pulumi: createAdminPulumiApp(projectAppParams)
    };
}

export const createAdminPulumiApp = (projectAppParams: CreateAdminAppParams) => {
    const app = createPulumiApp({
        name: "admin",
        path: "apps/admin",
        config: projectAppParams,
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

            const domain = app.getInput(projectAppParams.domain);
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

    if (projectAppParams.pulumi) {
        projectAppParams.pulumi(app);
    }

    return app;
};
