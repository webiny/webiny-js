import { SourceHandler, HandlerEvent, HandlerFactoryParams } from "~/types";

export const createSourceHandler = <
    TEvent extends HandlerEvent,
    TParams extends HandlerFactoryParams
>(
    handler: SourceHandler<TEvent, TParams>
) => {
    return handler;
};
