import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import {
    WEBHOOK_SETTINGS_MODEL_ID,
    WEBHOOK_DELIVERY_MAX_RETENTION_DAYS
} from "~/api/domain/constants.js";

class WebhookSettingsModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private({ modelId: WEBHOOK_SETTINGS_MODEL_ID, name: "Webhook Settings" })
                .singleEntry()
                .fields(fields => ({
                    signingSecret: fields.text().label("Signing Secret").encrypt(),
                    deliveryRetentionDays: fields
                        .number()
                        .label("Delivery Retention (days)")
                        .gte(0, "Must be 0 or greater.")
                        .lte(
                            WEBHOOK_DELIVERY_MAX_RETENTION_DAYS,
                            `Must be at most ${WEBHOOK_DELIVERY_MAX_RETENTION_DAYS}.`
                        )
                }))
        ];
    }
}

export const WebhookSettingsModel = ModelFactory.createImplementation({
    implementation: WebhookSettingsModelFactory,
    dependencies: []
});
