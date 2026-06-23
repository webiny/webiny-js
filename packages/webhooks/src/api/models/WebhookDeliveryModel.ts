import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WEBHOOK_DELIVERY_MODEL_ID } from "~/api/domain/constants.js";

class WebhookDeliveryModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder
            .private({
                modelId: WEBHOOK_DELIVERY_MODEL_ID,
                name: "Webhook Delivery"
            })
            .tags(["$publishing:false", "$hidden:true"]);

        model.fields(fields => ({
            webhookId: fields.text().label("Webhook ID").required(),
            backgroundTaskId: fields.text().label("Background Task ID"),
            eventType: fields.text().label("Event Type").required(),
            status: fields.text().label("Status").required(),
            payload: fields.text().compress().label("Payload"),
            requestHeaders: fields.text().compress().label("Request Headers"),
            responseTime: fields.number().label("Response Time (ms)"),
            responseStatus: fields.number().label("Response Status"),
            responseHeaders: fields.text().compress().label("Response Headers"),
            responseBody: fields.text().compress().label("Response Body")
        }));

        return [model];
    }
}

export const WebhookDeliveryModel = ModelFactory.createImplementation({
    implementation: WebhookDeliveryModelFactory,
    dependencies: []
});
