import { PluginsContainer } from "@webiny/plugins";
import { Context } from "~/types";

export const createMockContext = (params?: Partial<Context>): Context => {
    return {
        ...params,
        plugins: params?.plugins || new PluginsContainer()
    } as unknown as Context;
};
