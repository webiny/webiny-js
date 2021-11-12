import { ModelManagerPlugin } from "~/types";
import { DefaultContentModelManager } from "./DefaultContentModelManager";

const plugin: ModelManagerPlugin = {
    type: "cms-content-model-manager",
    name: "content-model-manager-default",
    create: async (context, model) => {
        return new DefaultContentModelManager(context, model);
    }
};

export default () => plugin;
