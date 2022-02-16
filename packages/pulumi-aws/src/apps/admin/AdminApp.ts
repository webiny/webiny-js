import * as aws from "@pulumi/aws";

import { tagResources } from "@webiny/cli-plugin-deploy-pulumi/utils";
import {
    defineApp,
    createGenericApplication,
    mergeAppHooks,
    ApplicationConfig
} from "@webiny/pulumi-sdk";

import { createAppBucket } from "../createAppBucket";
import { adminUpload } from "./AdminHookUpload";

export interface AdminAppConfig extends ApplicationConfig {
    config?(app: InstanceType<typeof AdminApp>): void;
}

export const AdminApp = defineApp({
    name: "Admin",
    config(app) {
        app.addHandler(() => {
            tagResources({
                WbyProjectName: String(process.env.WEBINY_PROJECT_NAME),
                WbyEnvironment: String(process.env.WEBINY_ENV)
            });
        });

        const bucket = createAppBucket(app, "admin-app");

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

        app.addOutputs({
            appStorage: bucket.bucket.output.id,
            appUrl: cloudfront.output.domainName.apply(value => `https://${value}`)
        });

        return {
            ...bucket,
            cloudfront
        };
    }
});

export type AdminApp = InstanceType<typeof AdminApp>;

export function createAdminApp(config: AdminAppConfig) {
    const app = new AdminApp();

    config.config?.(app);

    return createGenericApplication({
        id: config.id,
        name: config.name,
        description: config.description,
        cli: config.cli,
        app: app,
        beforeBuild: config.beforeBuild,
        afterBuild: config.afterBuild,
        beforeDeploy: config.beforeDeploy,
        afterDeploy: mergeAppHooks(adminUpload, config.afterDeploy)
    });
}
