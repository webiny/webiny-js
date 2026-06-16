import "./handler/register.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createFeature } from "@webiny/feature/api/index.js";
import { WebsocketsTransport } from "@webiny/api-websockets";
import { AwsWebsocketsTransport } from "~/transport/AwsWebsocketsTransport.js";

class AwsWebsocketsTransportImpl extends AwsWebsocketsTransport implements WebsocketsTransport.Interface {}

const AwsTransport = WebsocketsTransport.createImplementation({
    implementation: AwsWebsocketsTransportImpl,
    dependencies: []
});

const transportFeature = createFeature({
    name: "websockets.aws.transport",
    register: container => {
        container.register(AwsTransport).inSingletonScope();
    }
});

export const createAwsWebsockets = () => {
    const plugin = createRegisterExtensionPlugin(context => {
        return transportFeature.register(context.container);
    });
    plugin.name = "websockets.aws.transport";
    return [plugin];
};

export type * from "./handler/types.js";
