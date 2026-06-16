import "./handler/register.js";
import type { Plugin } from "@webiny/plugins/types.js";
import { ContextPlugin } from "@webiny/handler";
import { Transport } from "@webiny/api-websockets";
import { AwsWebsocketsTransport } from "~/transport/AwsWebsocketsTransport.js";
import type { Context } from "@webiny/api-websockets";

export const createAwsWebsockets = (): Plugin[] => {
    const plugin = new ContextPlugin<Context>(async context => {
        context.container.registerInstance(Transport, new AwsWebsocketsTransport());
    });
    plugin.name = "websockets.aws.transport";
    return [plugin];
};

export type * from "./handler/types.js";
