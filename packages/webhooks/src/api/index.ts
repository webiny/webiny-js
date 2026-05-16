import { WebhooksFeature} from "./WebhooksFeature.js";
import {createRegisterExtensionPlugin} from "@webiny/handler";


export const createWebhooks = () => {
    return createRegisterExtensionPlugin(async context => {
        WebhooksFeature.register(context.container);
    });
}
