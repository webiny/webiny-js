import { defineApp, createGenericApplication, ApplicationConfig } from "@webiny/pulumi-sdk";

import { createReactAppGateway, GatewayReactAppConfig } from "./GatewayReactApp";
import { createLambdas } from "./GatewayLambdas";
import { createApiAppGateway, GatewayApiConfig } from "./GatewayApi";

export interface GatewayAppConfig {
    api?: GatewayApiConfig;
    admin?: GatewayReactAppConfig;
    website?: GatewayReactAppConfig;
}

export const GatewayApp = defineApp({
    name: "Gateway",
    config(app, config: GatewayAppConfig) {
        const lambdas = createLambdas(app);

        const api = createApiAppGateway(app, {
            name: "api",
            lambdas,
            config: config.api || {}
        });

        const admin = createReactAppGateway(app, {
            name: "admin",
            lambdas,
            config: config.admin || {}
        });

        const website = createReactAppGateway(app, {
            name: "website",
            lambdas,
            config: config.website || {}
        });

        return {
            lambdas,
            api,
            admin,
            website
        };
    }
});

export type GatewayApp = InstanceType<typeof GatewayApp>;

export function createGatewayApp(config: GatewayAppConfig & ApplicationConfig<GatewayApp>) {
    return createGenericApplication({
        id: "gateway",
        name: "gateway",
        description: "Your project's gateway area.",
        cli: {
            // Default args for the "yarn webiny watch ..." command (we don't need deploy option while developing).
            watch: {
                deploy: false
            }
        },
        async app(ctx) {
            const app = new GatewayApp(ctx);
            await app.setup(config);
            await config.config?.(app, ctx);
            return app;
        },
        beforeBuild: config.beforeBuild,
        afterBuild: config.afterBuild,
        beforeDeploy: config.beforeDeploy,
        afterDeploy: config.afterDeploy
    });
}
