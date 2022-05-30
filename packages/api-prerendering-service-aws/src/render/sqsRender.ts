import { SQSEvent } from "aws-lambda";
import plugin, { RenderParams } from "@webiny/api-prerendering-service/render";
import { ArgsContext } from "@webiny/handler-args/types";
import { Context, HandlerPlugin as DefaultHandlerPlugin } from "@webiny/handler/types";

export interface HandlerContext extends Context, ArgsContext<SQSEvent> {
    //
}

export type HandlerPlugin = DefaultHandlerPlugin<HandlerContext>;

export default (params: RenderParams): HandlerPlugin => {
    const render = plugin(params);

    return {
        type: "handler",
        handle(context) {
            const events = context.invocationArgs.Records.map(r => JSON.parse(r.body));
            return render.handle(
                {
                    ...context,
                    invocationArgs: events
                },
                async () => void 0
            );
        }
    };
};
