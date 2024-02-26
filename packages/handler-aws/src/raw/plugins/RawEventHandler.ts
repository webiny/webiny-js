import type { Context as LambdaContext } from "aws-lambda";
import { Context as BaseContext, Reply } from "@webiny/handler/types";
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
> extends EventPlugin<Event, Context, Response> {
    public constructor(cb: RawEventHandlerCallable<Event, Context, Response>) {
        /**
         * Callable is correct, TS is just having problems with the override.
         */
        // @ts-expect-error
        super(cb);
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
