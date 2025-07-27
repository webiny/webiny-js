import { PluginsContainer } from "@webiny/plugins";
import {
    type ITransformHandlerParams,
    TransformHandler
} from "~/resolver/app/transform/TransformHandler";

export const createMockTransformHandler = (params: Partial<ITransformHandlerParams> = {}) => {
    return new TransformHandler({
        plugins: params.plugins || new PluginsContainer()
    });
};
