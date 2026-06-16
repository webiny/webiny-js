import "./handler/register.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { AwsWebsocketsTransport } from "~/transport/AwsWebsocketsTransport.js";

export const createAwsWebsockets = () => {
    const plugin = createRegisterExtensionPlugin(context => {
        context.container.register(AwsWebsocketsTransport).inSingletonScope();
    });
    plugin.name = "websockets.aws.transport";
    return [plugin];
};

export type * from "./handler/types.js";
