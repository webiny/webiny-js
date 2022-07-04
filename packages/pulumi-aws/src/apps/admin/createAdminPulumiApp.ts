import * as aws from "@pulumi/aws";

import { createPulumiApp, PulumiAppParamCallback } from "@webiny/pulumi";
import { tagResources } from "~/utils";
import { createPublicAppBucket } from "../createAppBucket";
import { applyCustomDomain, CustomDomainParams } from "../customDomain";

export type AdminPulumiApp = ReturnType<typeof createAdminPulumiApp>;

export interface CreateAdminPulumiAppParams {
    /** Custom domain configuration */
    domain?: PulumiAppParamCallback<CustomDomainParams>;

    /**
     * Provides a way to adjust existing Pulumi code (cloud infrastructure resources)
     * or add additional ones into the mix.
     */
    pulumi?: (app: AdminPulumiApp) => void | Promise<void>;
}

export const createAdminPulumiApp = (projectAppParams: CreateAdminPulumiAppParams) => {
    return createPulumiApp({
        name: "admin",
        path: "apps/admin",
        config: projectAppParams,
        program: async app => {
            // Overrides must be applied via a handler, registered at the very start of the program.
            // By doing this, we're ensuring user's adjustments are not applied to late.
            if (projectAppParams.pulumi) {
                app.addHandler(() => {
                    return projectAppParams.pulumi!(app as AdminPulumiApp);
                });
            }

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

            const domain = app.getParam(projectAppParams.domain);
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
};
