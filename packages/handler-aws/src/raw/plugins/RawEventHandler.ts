import { Reply, Context as BaseContext } from "@webiny/handler/types";
import { Context as LambdaContext } from "aws-lambda";
import { EventPlugin, EventPluginCallableParams } from "@webiny/handler";

export interface RawEventHandlerCallableParams<Event, Context extends BaseContext>
    extends EventPluginCallableParams<Event, Context> {
    lambdaContext: LambdaContext;
}
export interface RawEventHandlerCallable<Event, Context extends BaseContext, Response> {
    (params: RawEventHandlerCallableParams<Event, Context>): Promise<Response | Reply>;
}

export class RawEventHandler<
    Event = any,
    Context extends BaseContext = BaseContext,
    Response = any
> extends EventPlugin {
    public constructor(cb: RawEventHandlerCallable<Event, Context, Response>) {
        super(cb as any);
    }
}

export const createEventHandler = <
    Event = any,
    Context extends BaseContext = BaseContext,
    Response = any
>(
    cb: RawEventHandlerCallable<Event, Context, Response>
) => {
    return new RawEventHandler<Event, Context, Response>(cb);
};
