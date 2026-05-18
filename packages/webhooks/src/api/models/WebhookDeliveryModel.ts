import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WEBHOOK_DELIVERY_MODEL_ID } from "~/api/domain/constants.js";

class WebhookDeliveryModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder
            .public({
                modelId: WEBHOOK_DELIVERY_MODEL_ID,
                name: "Webhook Delivery",
                group: "hidden"
            })
            .description("Stores webhook delivery logs.")
            .singularApiName("WebhookDelivery")
            .pluralApiName("WebhookDeliveries")
            .tags(["$publishing:false", "$hidden:true"]);

        model.fields(fields => ({
            webhookId: fields.text().label("Webhook ID").required(),
            backgroundTaskId: fields.text().label("Background Task ID"),
            eventType: fields.text().label("Event Type").required(),
            status: fields.text().label("Status").required(),
            payload: fields.text().compressed().label("Payload"),
            requestHeaders: fields.text().compressed().label("Request Headers"),
            responseTime: fields.number().label("Response Time (ms)"),
            responseStatus: fields.number().label("Response Status"),
            responseHeaders: fields.text().compressed().label("Response Headers"),
            responseBody: fields.text().compressed().label("Response Body")
        }));

        return [model];
    }
}

export const WebhookDeliveryModel = ModelFactory.createImplementation({
    implementation: WebhookDeliveryModelFactory,
    dependencies: []
});
