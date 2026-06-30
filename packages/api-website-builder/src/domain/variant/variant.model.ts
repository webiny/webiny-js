import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";

export const VARIANT_MODEL_ID = process.env.WEBINY_API_LEGACY_MODELS ? "wbVariant" : "wbyWbVariant";

class VariantModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder.private({
            modelId: VARIANT_MODEL_ID,
            name: "Website Builder - Variant"
        });

        model.fields(fields => ({
            // The experiment (CMS entryId) this variant belongs to.
            experimentId: fields.text().label("Experiment ID"),
            name: fields.text().label("Name"),
            // Variant lifecycle status: draft | ready.
            status: fields.text().label("Status"),
            // Full content snapshot — mirrors the page content fields. A variant is never a revision.
            properties: fields.searchableJson().label("Properties"),
            metadata: fields.searchableJson().label("Metadata"),
            bindings: fields.json().label("Bindings"),
            elements: fields.json().label("Elements"),
            extensions: fields.searchableJson().label("Extensions")
        }));

        return [model];
    }
}

export const VariantModelPlugin = ModelFactory.createImplementation({
    implementation: VariantModelFactory,
    dependencies: []
});
