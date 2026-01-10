import { PrivateModelProvider as ProviderAbstraction } from "./abstractions.js";
import { FieldBuilderRegistry, PrivateModel } from "../abstractions.js";
import type { CmsModel } from "~/types/index.js";
import { createPrivateModelPlugin } from "~/plugins/CmsModelPlugin.js";
import { PrivateModelBuilder } from "./PrivateModelBuilder.js";

export class PrivateModelProvider implements ProviderAbstraction.Interface {
    constructor(
        private getPrivateModels: () => PrivateModel.Interface[],
        private fieldsRegistry: FieldBuilderRegistry.Interface
    ) {}

    async getModels(): Promise<CmsModel[]> {
        const models: CmsModel[] = [];
        const privateModels = this.getPrivateModels();

        for (const model of privateModels) {
            const builder = new PrivateModelBuilder(this.fieldsRegistry);

            const modelBuilder = await model.buildModel(builder);
            const modelConfig = modelBuilder.build();

            // Convert to CmsModel using existing plugin
            const plugin = createPrivateModelPlugin(modelConfig);
            models.push(plugin.contentModel as CmsModel);
        }

        return models;
    }
}
