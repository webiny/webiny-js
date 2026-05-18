import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";

export const PAGE_MODEL_ID = process.env.WEBINY_API_LEGACY_MODELS ? "wbPage" : "wbyWbPage";

class PageModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder.private({
            modelId: PAGE_MODEL_ID,
            name: "Website Builder - Page"
        });

        model.fields(fields => ({
            properties: fields.searchableJson().label("Properties"),
            metadata: fields.searchableJson().label("Metadata"),
            bindings: fields.json().label("Bindings"),
            elements: fields.json().label("Elements"),
            extensions: fields.searchableJson().label("Extensions")
        }));

        return [model];
    }
}

export const PageModelPlugin = ModelFactory.createImplementation({
    implementation: PageModelFactory,
    dependencies: []
});
