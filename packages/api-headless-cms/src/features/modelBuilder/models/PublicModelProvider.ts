import {
    PublicModelProvider as ProviderAbstraction,
} from "./abstractions.js";
import type { CmsModel } from "~/types/index.js";
import { createModelPlugin } from "~/plugins/CmsModelPlugin.js";
import { FieldBuilderRegistry, PublicModel } from "~/features/modelBuilder/index.js";
import { PublicModelBuilder } from "~/features/modelBuilder/models/PublicModelBuilder.js";

class PublicModelProviderImpl implements ProviderAbstraction.Interface {
    constructor(
        private models: PublicModel.Interface[],
        private fieldsRegistry: FieldBuilderRegistry.Interface
    ) {}

    async getModels(): Promise<CmsModel[]> {
        const models: CmsModel[] = [];

        for (const model of this.models) {
            const builder = new PublicModelBuilder(this.fieldsRegistry);

            const modelBuilder = await model.buildModel(builder);
            const modelConfig = modelBuilder.build();

            // Convert to CmsModel using existing plugin
            const plugin = createModelPlugin(modelConfig);
            models.push(plugin.contentModel as CmsModel);
        }

        return models;
    }
}

export const PublicModelProvider = ProviderAbstraction.createImplementation({
    implementation: PublicModelProviderImpl,
    dependencies: [[PublicModel, { multiple: true }], FieldBuilderRegistry]
});
