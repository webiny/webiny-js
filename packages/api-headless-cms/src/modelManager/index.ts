import { CmsModelManager, ModelManagerPlugin } from "~/types";
import { DefaultCmsModelManager } from "./DefaultCmsModelManager";
export * from "./SingletonModelManager";

const plugin: ModelManagerPlugin = {
    type: "cms-content-model-manager",
    name: "content-model-manager-default",
    async create(context, model) {
        return new DefaultCmsModelManager(context, model) as CmsModelManager<any>;
    }
};

export const createDefaultModelManager = () => plugin;
