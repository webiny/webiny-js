import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";

export const LAYOUT_MODEL_ID = "wbyWbLayout";

class LayoutModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder.private({
            modelId: LAYOUT_MODEL_ID,
            name: "Website Builder - Layout",
            lifecycleEvents: false
        });

        model.fields(fields => ({
            properties: fields.searchableJson().label("Properties"),
            metadata: fields.json().label("Metadata"),
            elements: fields.json().label("Elements"),
            bindings: fields.json().label("Bindings"),
            extensions: fields.json().label("Extensions")
        }));

        return [model];
    }
}

export const LayoutModelPlugin = ModelFactory.createImplementation({
    implementation: LayoutModelFactory,
    dependencies: []
});
