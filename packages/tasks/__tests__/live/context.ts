import { PluginCollection } from "@webiny/plugins/types";
import { useRawHandler } from "~tests/helpers/useRawHandler";
import { Context } from "~tests/types";

export interface CreateLiveContextParams<C extends Context = Context> {
    plugins?: PluginCollection;
    handler?: ReturnType<typeof useRawHandler<C>>;
}

export const createLiveContext = async <C extends Context = Context>(
    params?: CreateLiveContextParams<C>,
    payload?: Record<string, any>
) => {
    if (params?.handler) {
        return params.handler.handle(payload);
    }
    const handler = useRawHandler<C>({
        plugins: [...(params?.plugins || [])]
    });

    return handler.handle(payload);
};

export const createLiveContextFactory = <C extends Context = Context>(
    params?: CreateLiveContextParams<C>
) => {
    return (payload: Record<string, any> = {}) => {
        return createLiveContext<C>(params, payload);
    };
};
