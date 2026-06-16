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
            name: fields.text().label("Name").required(),
            slug: fields
                .text()
                .label("Slug")
                .required()
                .description("URL-safe identifier, unique per tenant.")
                .minLength(3, "Slug must be at least 3 characters long.")
                .pattern(
                    "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                    "",
                    "Slug can only contain lowercase letters, numbers, and hyphens, and must start and end with a letter or number."
                ),
            endpointUrl: fields
                .text()
                .label("Endpoint URL")
                .required()
                .description("HTTPS destination for POST requests.")
                .url("Must be a valid URL starting with https://")
                .minLength(8, "Endpoint URL must be at least 8 characters long.")
                .pattern(
                    "^(https:\\/\\/.+|http:\\/\\/localhost.*)",
                    "",
                    "Endpoint URL must start with https://"
                ),
            description: fields.longText().label("Description"),
            enabled: fields.boolean().label("Enabled").defaultValue(false),
            events: fields
                .text()
                .list()
                .label("Events")
                .defaultValue([])
                .listMinLength(1, "At least one event must be selected."),
            signingSecret: fields
                .text()
                .label("Signing Secret")
                .required()
                .description("Signing secret - will be encrypted in the database.")
                .minLength(16, "Signing secret must be at least 16 characters long.")
        }));

        return [model];
    }
}

export const WebhookModel = ModelFactory.createImplementation({
    implementation: WebhookModelFactory,
    dependencies: []
});
