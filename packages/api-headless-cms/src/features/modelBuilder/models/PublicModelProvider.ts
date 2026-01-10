import { PublicModelProvider as ProviderAbstraction } from "./abstractions.js";
import type { CmsModel } from "~/types/index.js";
import { createModelPlugin } from "~/plugins/CmsModelPlugin.js";
import { FieldBuilderRegistry, PublicModel } from "~/features/modelBuilder/index.js";
import { PublicModelBuilder } from "~/features/modelBuilder/models/PublicModelBuilder.js";

export class PublicModelProvider implements ProviderAbstraction.Interface {
    constructor(
        private getPublicModels: () => PublicModel.Interface[],
        private fieldsRegistry: FieldBuilderRegistry.Interface
    ) {}

    async getModels(): Promise<CmsModel[]> {
        const models: CmsModel[] = [];
        const publicModels = this.getPublicModels();

        for (const model of publicModels) {
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
