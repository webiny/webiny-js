import { createRawHandler } from "@webiny/handler-aws";
import type { LambdaContext } from "@webiny/handler-aws/types";
import type { Context } from "~tests/types";
import type { PluginCollection } from "@webiny/plugins/types";
import { createPlugins } from "./plugins";

export interface UseHandlerParams {
    plugins?: PluginCollection;
}

export const useHandler = (params?: UseHandlerParams) => {
    const { plugins = [] } = params || {};

    const handler = createRawHandler<any, Context>({
        plugins: createPlugins({ plugins })
    });

    return {
        handle: async () => {
            return await handler({}, {} as LambdaContext);
        }
    };
};
