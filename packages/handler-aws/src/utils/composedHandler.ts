import { Plugin } from "@webiny/plugins/types";
import { composeAsync } from "@webiny/utils";

type WrappedInput<TInput, TOutput> = TInput & {
    next: () => Promise<TOutput>;
};

export const createComposedHandler = <P extends Plugin, TInput, TOutput>(plugins: P[]) => {
    return composeAsync<WrappedInput<TInput, TOutput>, TOutput>(
        plugins.map(plugin => {
            return next => {
                return async params => {
                    return plugin.cb({
                        ...params,
                        next: () => {
                            return next(params);
                        }
                    });
                };
            };
        })
    );
};
