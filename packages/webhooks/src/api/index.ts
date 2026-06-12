import { WebhooksFeature } from "./WebhooksFeature.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";

export { WebhooksFeature };

/** @deprecated use WebhooksFeature instead */
export const createWebhooks = () => {
    return createRegisterExtensionPlugin(async context => {
        WebhooksFeature.register(context.container);
    });
};
