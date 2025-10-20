import { createContextPlugin } from "@webiny/handler";
import { ApiCoreFeature } from "./ApiCoreFeature.js";

export const createApiCore = () => {
    return createContextPlugin(context => {
        ApiCoreFeature.register(context.container);
    });
};
