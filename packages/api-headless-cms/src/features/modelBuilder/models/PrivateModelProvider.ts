import { PrivateModelProvider as ProviderAbstraction } from "./abstractions.js";
import { FieldBuilderRegistry, PrivateModel } from "../abstractions.js";
import type { CmsModel } from "~/types/index.js";
import { createPrivateModelPlugin } from "~/plugins/CmsModelPlugin.js";
import { PrivateModelBuilder } from "./PrivateModelBuilder.js";

class PrivateModelProviderImpl implements ProviderAbstraction.Interface {
    constructor(
        private models: PrivateModel.Interface[],
        private fieldsRegistry: FieldBuilderRegistry.Interface
    ) {}

    async getModels(): Promise<CmsModel[]> {
        const models: CmsModel[] = [];

        for (const model of this.models) {
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

export const PrivateModelProvider = ProviderAbstraction.createImplementation({
    implementation: PrivateModelProviderImpl,
    dependencies: [[PrivateModel, { multiple: true }], FieldBuilderRegistry]
});
