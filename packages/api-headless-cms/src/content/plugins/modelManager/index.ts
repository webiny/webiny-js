import { ContentModelManagerPlugin } from "@webiny/api-headless-cms/types";
import { DefaultContentModelManager } from "./DefaultContentModelManager";

const plugin: ContentModelManagerPlugin = {
    type: "content-model-manager",
    name: "content-model-manager-default",
    create: async (context, model) => {
        return new DefaultContentModelManager(context, model);
    }
};

export default () => plugin;
