import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { REMOTE_COMPONENT_MODEL_ID } from "~/shared/constants.js";

class WbyRemoteComponentModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder
            .private({
                modelId: REMOTE_COMPONENT_MODEL_ID,
                name: "Remote Component"
            })
            .tags(["$publishing:false"]);

        model.fields(fields => ({
            name: fields.text().label("Name").required(),
            label: fields.text().label("Label").required(),
            description: fields.text().label("Description"),
            aiContext: fields.text().label("AI Context"),
            source: fields.text().compress().label("Source"),
            css: fields.text().compress().label("CSS"),
            bundledJs: fields.text().compress().label("Bundled JS"),
            bundledJsSha256: fields.text().label("Bundled JS SHA-256"),
            bundledCss: fields.text().compress().label("Bundled CSS"),
            bundledCssSha256: fields.text().label("Bundled CSS SHA-256"),
            aiPrompt: fields.text().compress().label("AI Prompt"),
            status: fields.text().label("Status"),
            sdkVersion: fields.text().label("SDK Version")
        }));

        return [model];
    }
}

export const WbyRemoteComponentModel = ModelFactory.createImplementation({
    implementation: WbyRemoteComponentModelFactory,
    dependencies: []
});
