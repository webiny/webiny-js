import { WebhooksFeature } from "./WebhooksFeature.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";

export const createWebhooks = () => {
    const plugin = createRegisterExtensionPlugin(async context => {
        WebhooksFeature.register(context.container);
    });

    plugin.name = "webhooks.extension";

    return plugin;
};
