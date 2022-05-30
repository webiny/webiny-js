import * as aws from "@pulumi/aws";

import {
    defineApp,
    createGenericApplication,
    ApplicationContext,
    ApplicationConfig,
    updateGatewayConfig
} from "@webiny/pulumi-sdk";

import { createPublicAppBucket } from "../createAppBucket";
import { applyCustomDomain, CustomDomainParams } from "../customDomain";
import { adminUpload } from "./AdminUpload";

export interface AdminAppConfig {
    /** Custom domain configuration */
    domain?(ctx: ApplicationContext): CustomDomainParams | undefined | void;
}

export const AdminApp = defineApp({
    name: "Admin",
    config(app, config: AdminAppConfig) {
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

        const domain = config.domain?.(app.ctx);
        if (domain) {
            applyCustomDomain(cloudfront, domain);
        }

        app.addOutputs({
            appStorage: bucket.bucket.output.id,
            appDomain: cloudfront.output.domainName,
            appUrl: cloudfront.output.domainName.apply(value => `https://${value}`)
        });

        app.onAfterDeploy(async ({ outputs }) => {
            await adminUpload({
                appDir: app.ctx.appDir,
                bucket: outputs["appStorage"]
            });
        });

        // Update variant gateway configuration.
        const variant = app.ctx.variant;
        if (variant) {
            app.onAfterDeploy(async ({ outputs }) => {
                // After deployment is made we update a static JSON file with a variant configuration.
                // TODO: We should update WCP config instead of a static file here
                await updateGatewayConfig({
                    app: "admin",
                    cwd: app.ctx.projectDir,
                    env: app.ctx.env,
                    variant: variant,
                    domain: outputs["appDomain"]
                });
            });
        }

        return {
            ...bucket,
            cloudfront
        };
    }
});

export type AdminApp = InstanceType<typeof AdminApp>;

export function createAdminApp(config?: AdminAppConfig & ApplicationConfig<AdminApp>) {
    return createGenericApplication({
        id: "admin",
        name: "admin",
        description: "Your project's admin area.",
        cli: {
            // Default args for the "yarn webiny watch ..." command (we don't need deploy option while developing).
            watch: {
                deploy: false
            }
        },
        async app(ctx) {
            // Create the app instance.
            const app = new AdminApp(ctx);
            // Run the default application setup.
            await app.setup(config || {});
            // Run the custom user config.
            await config?.config?.(app, ctx);
            return app;
        },
        onBeforeBuild: config?.onBeforeBuild,
        onAfterBuild: config?.onAfterBuild,
        onBeforeDeploy: config?.onBeforeDeploy,
        onAfterDeploy: config?.onAfterDeploy
    });
}
