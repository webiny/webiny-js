import { createHandler as createDefaultHandler } from "@webiny/handler";
import { createFastifyPlugins, CreateFastifyHandlerParams } from "./plugins";
import { PluginCollection } from "@webiny/plugins/types";

export interface CreateHandlerParams extends CreateFastifyHandlerParams {
    plugins?: PluginCollection;
}
export const createHandler = (params?: CreateHandlerParams) => {
    return createDefaultHandler([
        ...createFastifyPlugins({
            options: params?.options || {}
        }),
        ...(params?.plugins || [])
    ]);
};

export * from "~/plugins/RoutePlugin";
