import { PluginCollection } from "@webiny/plugins/types";
import { useHandler } from "~tests/helpers/useHandler";
import { Context } from "~tests/types";

export interface CreateLiveContextParams<C extends Context = Context> {
    plugins?: PluginCollection;
    handler?: ReturnType<typeof useHandler<C>>;
}

export const createLiveContext = async <C extends Context = Context>(
    params?: CreateLiveContextParams<C>
) => {
    if (params?.handler) {
        return params.handler.handle();
    }
    const handler = useHandler<C>({
        plugins: [...(params?.plugins || [])]
    });

    return handler.handle();
};

export const createLiveContextFactory = <C extends Context = Context>(
    params?: CreateLiveContextParams<C>
) => {
    return () => {
        return createLiveContext<C>(params);
    };
};
