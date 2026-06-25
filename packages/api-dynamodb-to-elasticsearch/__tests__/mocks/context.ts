import { Context as BaseContext } from "@webiny/api";
import type { Context } from "@webiny/handler/types.js";
import { PluginsContainer } from "@webiny/plugins";
import type { Reply, Request } from "@webiny/handler-aws/types.js";

export interface ICreateMockContextParams {
    plugins: PluginsContainer;
}

export const createMockContext = (params: ICreateMockContextParams): Context => {
    const context = new BaseContext({
        plugins: params.plugins,
        WEBINY_VERSION: "0.0.0"
    });
    // @ts-expect-error
    context.reply = {} as Reply;
    // @ts-expect-error
    context.request = {} as Request;

    return context as unknown as Context;
};
