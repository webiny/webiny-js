import * as aws from "@pulumi/aws";

import { createPulumiApp, PulumiAppParamCallback } from "@webiny/pulumi";
import { tagResources } from "~/utils";
import { createPrivateAppBucket } from "../createAppBucket";
import { applyCustomDomain, CustomDomainParams } from "../customDomain";

export type ReactPulumiApp = ReturnType<typeof createReactPulumiApp>;

export interface CreateReactPulumiAppParams {
    /**
     * A name of the app, e.g., "user-area"
     */
    name: string;

    /**
     * A folder where the app is located, e.g., "apps/user-area"
     */
    folder: string;

    /** Custom domain configuration */
    domains?: PulumiAppParamCallback<CustomDomainParams>;

    /**
     * Provides a way to adjust existing Pulumi code (cloud infrastructure resources)
     * or add additional ones into the mix.
     */
    pulumi?: (app: ReactPulumiApp) => void | Promise<void>;
}

export const createReactPulumiApp = (projectAppParams: CreateReactPulumiAppParams) => {
    return createPulumiApp({
        name: projectAppParams.name,
        path: projectAppParams.folder,
        config: projectAppParams,
        program: async app => {
            const { name } = projectAppParams;

            // Overrides must be applied via a handler, registered at the very start of the program.
            // By doing this, we're ensuring user's adjustments are not applied to late.
            if (projectAppParams.pulumi) {
                app.addHandler(() => {
                    return projectAppParams.pulumi!(app as ReactPulumiApp);
                });
            }

            const bucket = createPrivateAppBucket(app, `${name}-app`);

            const cloudfront = app.addResource(aws.cloudfront.Distribution, {
                name: `${name}-app-cdn`,
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

            const domains = app.getParam(projectAppParams.domains);
            if (domains) {
                applyCustomDomain(cloudfront, domains);
            }

            app.addOutputs({
                appStorage: bucket.bucket.output.id,
                appDomain: cloudfront.output.domainName,
                appUrl: cloudfront.output.domainName.apply(value => `https://${value}`)
            });

            tagResources({
                WbyAppName: name,
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
