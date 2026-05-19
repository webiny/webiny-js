import { createFeature } from "@webiny/feature/api";
import { WebhookModel } from "./models/WebhookModel.js";
import { WebhookDeliveryModel } from "./models/WebhookDeliveryModel.js";
import { WebhookSettingsModel } from "./models/WebhookSettingsModel.js";
import { WebhookCrudSchema } from "./graphql/WebhookCrudSchema.js";
import { WebhookDeliverySchema } from "./graphql/WebhookDeliverySchema.js";
import { WebhookEventSchema } from "./graphql/WebhookEventSchema.js";
import { WebhookTriggerSchema } from "./graphql/WebhookTriggerSchema.js";
import { CreateWebhookFeature } from "./features/CreateWebhook/feature.js";
import { GetWebhookFeature } from "./features/GetWebhook/feature.js";
import { ListWebhooksFeature } from "./features/ListWebhooks/feature.js";
import { UpdateWebhookFeature } from "./features/UpdateWebhook/feature.js";
import { DeleteWebhookFeature } from "./features/DeleteWebhook/feature.js";
import { CreateWebhookDeliveryFeature } from "./features/CreateWebhookDelivery/feature.js";
import { UpdateWebhookDeliveryFeature } from "./features/UpdateWebhookDelivery/feature.js";
import { GetWebhookDeliveryFeature } from "./features/GetWebhookDelivery/feature.js";
import { ListWebhookDeliveriesFeature } from "./features/ListWebhookDeliveries/feature.js";
import { ResendWebhookDeliveryFeature } from "./features/ResendWebhookDelivery/feature.js";
import { TriggerWebhookFeature } from "./features/TriggerWebhook/feature.js";
import { ListAvailableWebhookEventsFeature } from "./features/ListAvailableWebhookEvents/feature.js";
import { WebhookPermissionsFeature } from "./features/WebhookPermissions/feature.js";
import { WebhookSignPayloadFeature } from "./features/WebhookSignPayload/feature.js";
import { WebhookDispatcherFeature } from "./features/WebhookDispatcher/feature.js";
import { SendWebhookTaskFeature } from "./features/SendWebhookTask/feature.js";
import { WebhooksTransformerFeature } from "./features/Transformers/feature.js";
import { GetWebhookSettingsFeature } from "./features/GetWebhookSettings/feature.js";
import { UpdateWebhookSettingsFeature } from "./features/UpdateWebhookSettings/feature.js";
import { WebhookSettingsSchema } from "./graphql/WebhookSettingsSchema.js";

export const WebhooksFeature = createFeature({
    name: "WebhookManagement",
    register(container) {
        // CMS models.
        container.register(WebhookModel);
        container.register(WebhookDeliveryModel);
        container.register(WebhookSettingsModel);

        // Transformers
        WebhooksTransformerFeature.register(container);

        // GraphQL.
        container.register(WebhookCrudSchema);
        container.register(WebhookDeliverySchema);
        container.register(WebhookEventSchema);
        container.register(WebhookTriggerSchema);
        container.register(WebhookSettingsSchema);

        // Core implementations.
        WebhookPermissionsFeature.register(container);
        WebhookSignPayloadFeature.register(container);
        WebhookDispatcherFeature.register(container);
        SendWebhookTaskFeature.register(container);

        // Webhook CRUD.
        CreateWebhookFeature.register(container);
        GetWebhookFeature.register(container);
        ListWebhooksFeature.register(container);
        UpdateWebhookFeature.register(container);
        DeleteWebhookFeature.register(container);

        // Delivery log.
        CreateWebhookDeliveryFeature.register(container);
        UpdateWebhookDeliveryFeature.register(container);
        GetWebhookDeliveryFeature.register(container);
        ListWebhookDeliveriesFeature.register(container);
        ResendWebhookDeliveryFeature.register(container);

        // Trigger + events.
        TriggerWebhookFeature.register(container);
        ListAvailableWebhookEventsFeature.register(container);

        // Settings.
        GetWebhookSettingsFeature.register(container);
        UpdateWebhookSettingsFeature.register(container);
    }
});
