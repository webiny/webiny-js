import { EventBridgeEvent } from "aws-lambda";

import { Args } from "@webiny/api-prerendering-service/types";
import plugin, { Params } from "@webiny/api-prerendering-service/flush";
import { ArgsContext } from "@webiny/handler-args/types";
import { Context, HandlerPlugin as DefaultHandlerPlugin } from "@webiny/handler/types";

export type HandlerArgs = EventBridgeEvent<"FlushPages", Args | Args[]>;

export interface HandlerContext extends Context, ArgsContext<HandlerArgs> {
    //
}

export type HandlerPlugin = DefaultHandlerPlugin<HandlerContext>;

export default (params: Params): HandlerPlugin => {
    const flush = plugin(params);

    return {
        type: "handler",
        handle(context) {
            if (context.invocationArgs["detail-type"] !== "FlushPages") {
                return;
            }

            const args = context.invocationArgs.detail;

            console.log(JSON.stringify(args));

            return flush.handle(
                {
                    ...context,
                    invocationArgs: args
                },
                async () => void 0
            );
        }
    };
};
