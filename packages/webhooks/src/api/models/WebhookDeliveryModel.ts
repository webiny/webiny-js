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
            webhookId: fields.text().label("Webhook ID").required().renderer("textInput"),
            backgroundTaskId: fields.text().label("Background Task ID").renderer("textInput"),
            eventType: fields.text().label("Event Type").required().renderer("textInput"),
            status: fields.text().label("Status").required().renderer("textInput"),
            payload: fields
                .longText()
                .label("Payload")
                .description("JSON.stringify(ICompressedValue) — full event body sent.")
                .renderer("textarea"),
            requestHeaders: fields
                .longText()
                .label("Request Headers")
                .description(
                    "JSON.stringify(ICompressedValue) — headers sent, including Webiny-Signature."
                )
                .renderer("textarea"),
            responseTime: fields.number().label("Response Time (ms)").renderer("numberInput"),
            responseStatus: fields.number().label("Response Status").renderer("numberInput"),
            responseBody: fields
                .longText()
                .label("Response Body")
                .description("JSON.stringify(ICompressedValue) — body returned by the endpoint.")
                .renderer("textarea")
        }));

        return [model];
    }
}

export default ModelFactory.createImplementation({
    implementation: WebhookDeliveryModelFactory,
    dependencies: []
});
