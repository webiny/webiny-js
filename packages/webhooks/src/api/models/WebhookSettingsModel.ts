import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WEBHOOK_SETTINGS_MODEL_ID } from "~/api/domain/constants.js";

class WebhookSettingsModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder
            .public({
                modelId: WEBHOOK_SETTINGS_MODEL_ID,
                name: "Webhook Settings",
                group: "hidden"
            })
            .description("Global settings for the webhooks system.")
            .titleFieldId("signingSecret")
            .singularApiName("WebhookSettings")
            .pluralApiName("WebhookSettings")
            .tags(["$publishing:false", "$hidden:true"])
            .singleEntry();

        model.fields(fields => ({
            signingSecret: fields
                .text()
                .label("Signing Secret")
                .encrypt()
                .description("Global signing secret used for all webhook deliveries.")
        }));

        return [model];
    }
}

export const WebhookSettingsModel = ModelFactory.createImplementation({
    implementation: WebhookSettingsModelFactory,
    dependencies: []
});
