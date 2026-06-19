import { createFeature } from "@webiny/feature/api";
import { AwsWebsocketsTransport } from "~/transport/AwsWebsocketsTransport.js";

export { AwsWebsocketsTransport } from "~/transport/AwsWebsocketsTransport.js";

export const WebsocketsAwsFeature = createFeature({
    name: "WebsocketsAws",
    register(container) {
        container.register(AwsWebsocketsTransport);
    }
});

/** @deprecated use WebsocketsAwsFeature.register(container) */
export const createAwsWebsockets = () => {
    console.warn(
        "[api-websockets-aws] createAwsWebsockets() is deprecated. Use WebsocketsAwsFeature.register(container) instead."
    );
    return [];
};
