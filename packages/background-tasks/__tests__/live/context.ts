import type { Container } from "@webiny/di";
import type { PluginCollection } from "@webiny/plugins/types";
import { useRawHandler } from "~tests/helpers/useRawHandler";
import type { Context } from "~tests/types";

/** A DI-native plugin: a plain function that registers into the container (see `useRawHandler`). */
export type DiPlugin = (container: Container) => void;

export interface CreateLiveContextParams<C extends Context = Context> {
    plugins?: (PluginCollection[number] | DiPlugin)[];
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
