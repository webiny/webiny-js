import { SQSEvent } from "aws-lambda";
import plugin, { RenderParams } from "@webiny/api-prerendering-service/render";
import { ArgsContext } from "@webiny/handler-args/types";
import { Context } from "@webiny/handler/types";
import { HandlerPlugin } from "@webiny/handler";

export interface HandlerContext extends Context, ArgsContext<SQSEvent> {
    //
}

export default (params: RenderParams) => {
    const render = plugin(params);

    return new HandlerPlugin<HandlerContext>(context => {
        const events = context.invocationArgs.Records.map(r => JSON.parse(r.body));

        return render.handle(
            {
                ...context,
                invocationArgs: events
            },
            async () => void 0
        );
    });
};
