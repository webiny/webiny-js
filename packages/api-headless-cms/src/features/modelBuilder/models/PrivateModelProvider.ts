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

            // Normalize fields: remove default/empty values to match old behavior
            const normalizeField = (field: any): any => {
                // Remove empty tags
                if (field.tags && Array.isArray(field.tags) && field.tags.length === 0) {
                    delete field.tags;
                }
                // Remove empty validation
                if (
                    field.validation &&
                    Array.isArray(field.validation) &&
                    field.validation.length === 0
                ) {
                    delete field.validation;
                }
                // Remove empty listValidation
                if (
                    field.listValidation &&
                    Array.isArray(field.listValidation) &&
                    field.listValidation.length === 0
                ) {
                    delete field.listValidation;
                }
                // Remove null helpText
                if (field.helpText === null) {
                    delete field.helpText;
                }
                // Remove null placeholderText
                if (field.placeholderText === null) {
                    delete field.placeholderText;
                }
                // Remove null renderer
                if (field.renderer === null) {
                    delete field.renderer;
                }
                // Remove empty settings (but keep if it has meaningful content)
                if (field.settings && typeof field.settings === "object") {
                    const hasContent = Object.keys(field.settings).some(key => {
                        const value = field.settings[key];
                        return (
                            value !== undefined &&
                            value !== null &&
                            !(Array.isArray(value) && value.length === 0)
                        );
                    });
                    if (!hasContent) {
                        delete field.settings;
                    }
                }
                // Remove default predefinedValues
                if (
                    field.predefinedValues &&
                    field.predefinedValues.enabled === false &&
                    Array.isArray(field.predefinedValues.values) &&
                    field.predefinedValues.values.length === 0
                ) {
                    delete field.predefinedValues;
                }

                // Recursively normalize nested fields
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
