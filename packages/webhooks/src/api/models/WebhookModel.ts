import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WEBHOOK_MODEL_ID } from "~/api/domain/constants.js";

class WebhookModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder
            .public({ modelId: WEBHOOK_MODEL_ID, name: "Webhook", group: "hidden" })
            .description("Stores webhook configurations.")
            .titleFieldId("name")
            .singularApiName("Webhook")
            .pluralApiName("Webhooks")
            .tags(["$publishing:false", "$hidden:true"]);

        model.fields(fields => ({
            name: fields.text().label("Name").required().renderer("textInput"),
            slug: fields
                .text()
                .label("Slug")
                .required()
                .description("URL-safe identifier, unique per tenant.")
                .renderer("textInput"),
            endpointUrl: fields
                .text()
                .label("Endpoint URL")
                .required()
                .description("HTTPS destination for POST requests.")
                .renderer("textInput"),
            description: fields.longText().label("Description").renderer("textarea"),
            enabled: fields.boolean().label("Enabled").defaultValue(false).renderer("switch"),
            events: fields
                .text()
                .list()
                .label("Events")
                .defaultValue([])
                .renderer("textInputs", {
                    multiValue: { addValueButtonLabel: "Add Event" }
                }),
            signingSecret: fields
                .text()
                .label("Signing Secret")
                .required()
                .description("HMAC-SHA256 signing secret in whsec_<random> format.")
                .renderer("textInput")
        }));

        return [model];
    }
}

export default ModelFactory.createImplementation({
    implementation: WebhookModelFactory,
    dependencies: []
});
