import type { Context as LambdaContext } from "@webiny/aws-sdk/types";
import { Context as BaseContext, Reply } from "@webiny/handler/types";
import { EventPlugin, EventPluginCallableParams } from "@webiny/handler";

export interface RawEventHandlerCallableParams<Event, Context extends BaseContext>
    extends EventPluginCallableParams<Event, Context> {
    lambdaContext: LambdaContext;
}
export interface RawEventHandlerCallable<Event, Context extends BaseContext, Response> {
    (params: RawEventHandlerCallableParams<Event, Context>): Promise<Response | Reply>;
}

export interface RawEventHandlerParamsConfig<
    Event = any,
    Context extends BaseContext = BaseContext,
    Response = any
> {
    canHandle(event: Event): boolean;
    handle: RawEventHandlerCallable<Event, Context, Response>;
}

export type RawEventHandlerParams<
    Event = any,
    Context extends BaseContext = BaseContext,
    Response = any
> =
    | RawEventHandlerCallable<Event, Context, Response>
    | RawEventHandlerParamsConfig<Event, Context, Response>;

export class RawEventHandler<
    Event = any,
    Context extends BaseContext = BaseContext,
    Response = any
> extends EventPlugin<Event, Context, Response> {
    private readonly params: RawEventHandlerParams<Event, Context, Response>;

    public constructor(params: RawEventHandlerParams<Event, Context, Response>) {
        const cb = typeof params === "function" ? params : params.handle;
        /**
         * Callable is correct, TS is just having problems with the override.
         */
        // @ts-expect-error
        super(cb);
        this.params = params;
    }
    /**
     *
     */
    public canHandle(event: Event): boolean {
        if (typeof this.params === "function" || !this.params?.canHandle) {
            return true;
        }
        return this.params.canHandle(event);
    }
}

export const createEventHandler = <
    Event = any,
    Context extends BaseContext = BaseContext,
    Response = any
>(
    params: RawEventHandlerParams<Event, Context, Response>
) => {
    return new RawEventHandler<Event, Context, Response>(params);
};
