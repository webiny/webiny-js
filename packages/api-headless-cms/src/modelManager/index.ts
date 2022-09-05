import { ModelManagerPlugin } from "~/types";
import { DefaultCmsModelManager } from "./DefaultCmsModelManager";

const plugin: ModelManagerPlugin = {
    type: "cms-content-model-manager",
    name: "content-model-manager-default",
    create: async (context, model) => {
        return new DefaultCmsModelManager(context, model);
    }
};

export const createDefaultModelManager = () => plugin;
