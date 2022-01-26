import { tagResources } from "@webiny/cli-plugin-deploy-pulumi/utils";
import { defineApp } from "@webiny/pulumi-sdk";
import { AdminCloudfront } from "./AdminCloudfront";

import { AppBucket } from "./AppBucket";

import { ApplicationConfig } from "./ApplicationConfig";
import { createGenericApplication } from "./GenericApplication";

export interface AdminApplicationConfig extends ApplicationConfig {
    config?(app: InstanceType<typeof AdminApplication>): void;
}

export const AdminApplication = defineApp({
    name: "Admin",
    config(app) {
        app.addHandler(() => {
            tagResources({
                WbyProjectName: String(process.env.WEBINY_PROJECT_NAME),
                WbyEnvironment: String(process.env.WEBINY_ENV)
            });
        });

        const bucket = app.addModule(AppBucket);
        const cloudfront = app.addModule(AdminCloudfront);

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

export function createAdminApplication(config: AdminApplicationConfig) {
    const app = new AdminApplication();

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
        afterDeploy: config.afterDeploy
    });
}
