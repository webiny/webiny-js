import { EventBridgeEvent } from "aws-lambda";
import { RenderEvent } from "@webiny/api-prerendering-service/types";
import plugin, { Params } from "@webiny/api-prerendering-service/flush";
import { ArgsContext } from "@webiny/handler-args/types";
import { Context } from "@webiny/handler/types";
import { HandlerPlugin } from "@webiny/handler";

export type HandlerArgs = EventBridgeEvent<"FlushPages", RenderEvent | RenderEvent[]>;
export interface HandlerContext extends Context, ArgsContext<HandlerArgs> {}

export default (params: Params) => {
    const flush = plugin(params);

    return new HandlerPlugin<HandlerContext>(async context => {
        if (context.invocationArgs["detail-type"] !== "FlushPages") {
            return;
        }

        return flush.handle(
            {
                ...context,
                invocationArgs: context.invocationArgs.detail
            },
            async () => void 0
        );
    });
};
