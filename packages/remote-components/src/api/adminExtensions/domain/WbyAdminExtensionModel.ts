import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { ADMIN_EXTENSION_MODEL_ID } from "./constants.js";

class WbyAdminExtensionModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder
            .private({
                modelId: ADMIN_EXTENSION_MODEL_ID,
                name: "Admin Extension",
                lifecycleEvents: false
            })
            .tags(["$publishing:false"]);

        model.fields(fields => ({
            kind: fields.text().label("Kind").required(),
            name: fields.text().label("Name").required(),
            label: fields.text().label("Label").required(),
            description: fields.text().label("Description"),
            enabled: fields.boolean().label("Enabled").defaultValue(true),
            runtimeVersion: fields.number().label("Runtime Version").required(),
            source: fields.text().compress().label("Source"),
            config: fields.text().label("Config"),
            compiled: fields.text().compress().label("Compiled")
        }));

        return [model];
    }
}

export const WbyAdminExtensionModel = ModelFactory.createImplementation({
    implementation: WbyAdminExtensionModelFactory,
    dependencies: []
});
