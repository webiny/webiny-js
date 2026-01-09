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

            // Normalize fields: remove empty tags arrays to match old behavior
            const normalizeField = (field: any): any => {
                if (field.tags && Array.isArray(field.tags) && field.tags.length === 0) {
                    delete field.tags;
                }
                if (field.settings?.fields) {
                    field.settings.fields = field.settings.fields.map(normalizeField);
                }
                return field;
            };

            if (modelConfig.fields) {
                modelConfig.fields = modelConfig.fields.map(normalizeField);
            }

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
