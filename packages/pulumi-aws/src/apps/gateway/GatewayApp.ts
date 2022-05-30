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
            config: config.api || {},
            viewerRequest: lambdas.functions.viewerRequest,
            viewerResponse: lambdas.functions.viewerResponse,
            originRequest: lambdas.functions.originRequest,
            configOriginRequest: lambdas.functions.configOriginRequest
        });

        const admin = createReactAppGateway(app, {
            name: "admin",
            config: config.admin || {},
            viewerRequest: lambdas.functions.viewerRequest,
            viewerResponse: lambdas.functions.viewerResponse,
            // We use a special lambda function for admin origin request.
            // It's rewriting asset urls to absolute on the fly
            originRequest: lambdas.functions.adminOriginRequest,
            configOriginRequest: lambdas.functions.configOriginRequest
        });

        const website = createReactAppGateway(app, {
            name: "website",
            config: config.website || {},
            viewerRequest: lambdas.functions.viewerRequest,
            viewerResponse: lambdas.functions.viewerResponse,
            originRequest: lambdas.functions.originRequest,
            configOriginRequest: lambdas.functions.configOriginRequest
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
        onBeforeBuild: config.onBeforeBuild,
        onAfterBuild: config.onAfterBuild,
        onBeforeDeploy: config.onBeforeDeploy,
        onAfterDeploy: config.onAfterDeploy
    });
}
