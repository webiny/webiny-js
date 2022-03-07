import path from "path";
import {
    createGenericApplication,
    ApplicationHooks,
    ApplicationConfig,
    defineApp
} from "@webiny/pulumi-sdk";

import { ApiApp, ApiAppConfig } from "../api/ApiApp";
import { WebsiteApp, WebsiteAppConfig } from "../website/WebsiteApp";
import { AdminApp, AdminAppConfig } from "../admin/AdminApp";

export interface WebinyAppConfig extends Partial<ApplicationHooks> {
    api?: ApiAppConfig;
    admin?: AdminAppConfig & ApplicationConfig<AdminApp>;
    website?: WebsiteAppConfig & ApplicationConfig<WebsiteApp>;
}

export const WebinyApp = defineApp({
    name: "Webiny",
    config(app, config: WebinyAppConfig) {
        const api = new ApiApp(
            {
                env: app.ctx.env,
                projectDir: app.ctx.projectDir,
                appDir: path.join(app.ctx.projectDir, "api")
            },
            config.api ?? {}
        );
        const admin = new AdminApp(
            {
                env: app.ctx.env,
                projectDir: app.ctx.projectDir,
                appDir: path.join(app.ctx.projectDir, "apps/admin")
            },
            config.admin ?? {}
        );
        const website = new WebsiteApp(
            {
                env: app.ctx.env,
                projectDir: app.ctx.projectDir,
                appDir: path.join(app.ctx.projectDir, "apps/website")
            },
            config.website ?? {}
        );

        config.api?.config?.(api, api.ctx);
        config.admin?.config?.(admin, admin.ctx);
        config.website?.config?.(website, website.ctx);

        app.addHandler(async () => {
            const outputs = await api.run();
            app.addOutput("api", outputs);
        });

        app.addHandler(async () => {
            const outputs = await admin.run();
            app.addOutput("admin", outputs);
        });

        app.addHandler(async () => {
            const outputs = await website.run();
            app.addOutput("website", outputs);
        });

        return {};
    }
});

export type WebinyApp = InstanceType<typeof WebinyApp>;

export function createWebinyApp(config: WebinyAppConfig) {
    return createGenericApplication({
        id: "webiny",
        name: "Webiny",
        description: "Your Webiny project.",
        cli: {
            // Default args for the "yarn webiny watch ..." command (we don't need deploy option while developing).
            watch: {
                deploy: false
            }
        },
        app(ctx) {
            const app = new WebinyApp(ctx, config ?? {});
            return app;
        },
        beforeBuild: config.beforeBuild,
        afterBuild: config.afterBuild,
        beforeDeploy: config.beforeDeploy,
        afterDeploy: config.afterDeploy
    });
}
