import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";

export const GLOBAL_COMPONENT_MODEL_ID = "wbyWbGlobalComponent";

class GlobalComponentModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder.private({
            modelId: GLOBAL_COMPONENT_MODEL_ID,
            name: "Website Builder - Global Component",
            lifecycleEvents: false
        });

        model.fields(fields => ({
            name: fields.text().label("Name"),
            language: fields.text().label("Language"),
            scope: fields.text().label("Scope"),
            elements: fields.json().label("Elements"),
            bindings: fields.json().label("Bindings")
        }));

        return [model];
    }
}

export const GlobalComponentModelPlugin = ModelFactory.createImplementation({
    implementation: GlobalComponentModelFactory,
    dependencies: []
});
