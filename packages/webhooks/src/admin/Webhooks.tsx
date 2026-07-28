import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { RegisterFeature } from "@webiny/app-admin";
import { ReactComponent as WebhookIcon } from "@webiny/icons/webhook.svg";
import { ListWebhooksFeature } from "./features/ListWebhooks/index.js";
import { GetWebhookFeature } from "./features/getWebhook/index.js";
import { CreateWebhookFeature } from "./features/createWebhook/index.js";
import { UpdateWebhookFeature } from "./features/updateWebhook/index.js";
import { DeleteWebhookFeature } from "./features/deleteWebhook/index.js";
import { ListWebhookDeliveriesFeature } from "./features/listWebhookDeliveries/index.js";
import { TriggerWebhookFeature } from "./features/triggerWebhook/index.js";
import { ResendWebhookDeliveryFeature } from "./features/resendWebhookDelivery/index.js";
import { ListAvailableEventsFeature } from "./features/listAvailableEvents/index.js";
import { GetWebhookSettingsFeature } from "./features/getWebhookSettings/index.js";
import { UpdateWebhookSettingsFeature } from "./features/updateWebhookSettings/index.js";
import { WebhookPermissionsFeature } from "./features/permissions/index.js";
import { WebhookListPresenterFeature } from "./presentation/WebhookList/index.js";
import { WebhookFormPresenterFeature } from "./presentation/WebhookForm/index.js";
import { WebhookSettingsPresenterFeature } from "./presentation/WebhookSettings/index.js";
import { WebhookRoutes } from "./WebhookRoutes.js";
import { WEBHOOK_PERMISSIONS_SCHEMA } from "~/admin/permissions.js";

const { Security } = AdminConfig;

export const Webhooks = () => {
    return (
        <>
            {/* Headless features. */}
            <RegisterFeature feature={ListWebhooksFeature} />
            <RegisterFeature feature={GetWebhookFeature} />
            <RegisterFeature feature={CreateWebhookFeature} />
            <RegisterFeature feature={UpdateWebhookFeature} />
            <RegisterFeature feature={DeleteWebhookFeature} />
            <RegisterFeature feature={ListWebhookDeliveriesFeature} />
            <RegisterFeature feature={TriggerWebhookFeature} />
            <RegisterFeature feature={ResendWebhookDeliveryFeature} />
            <RegisterFeature feature={ListAvailableEventsFeature} />
            <RegisterFeature feature={GetWebhookSettingsFeature} />
            <RegisterFeature feature={UpdateWebhookSettingsFeature} />
            <RegisterFeature feature={WebhookPermissionsFeature} />
            {/* Presentation features. */}
            <RegisterFeature feature={WebhookListPresenterFeature} />
            <RegisterFeature feature={WebhookFormPresenterFeature} />
            <RegisterFeature feature={WebhookSettingsPresenterFeature} />
            {/* Routes + menu. */}
            <WebhookRoutes />
            {/* Security permissions UI. */}
            <AdminConfig>
                <Security.Permissions
                    name="webhooks"
                    title="Webhooks"
                    description="Manage webhook permissions."
                    icon={<WebhookIcon />}
                    schema={WEBHOOK_PERMISSIONS_SCHEMA}
                />
            </AdminConfig>
        </>
    );
};
