import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import { AdminLayout } from "@webiny/app-admin";
import { ReactComponent as WebhookIcon } from "@webiny/icons/webhook.svg";
import { ReactComponent as WebhookDeliveryIcon } from "@webiny/icons/webhook.svg";
import { HasPermission } from "./presentation/security/HasPermission.js";
import { WebhookListView } from "./presentation/WebhookList/components/WebhookListView.js";
import { WebhookFormView } from "./presentation/WebhookForm/components/WebhookFormView.js";
import { WebhookSettingsView } from "./presentation/WebhookSettings/components/WebhookSettingsView.js";
import { WebhookDeliveriesPage } from "./presentation/WebhookDeliveriesPage/components/WebhookDeliveriesPage.js";
import { Routes } from "./routes.js";

const { Menu, Route } = AdminConfig;

const beta = <Menu.Link.Badge text="BETA" />;

export const WebhookRoutes = () => {
    const { getLink } = useRouter();

    return (
        <AdminConfig>
            <HasPermission entity="webhook">
                <Route
                    route={Routes.List}
                    element={
                        <AdminLayout title="Webhooks">
                            <WebhookListView />
                        </AdminLayout>
                    }
                />
                <Route
                    route={Routes.Deliveries}
                    element={
                        <AdminLayout title="Delivery Log">
                            <WebhookDeliveriesPage />
                        </AdminLayout>
                    }
                />
                <Route
                    route={Routes.Settings}
                    element={
                        <AdminLayout title="Webhook Settings">
                            <WebhookSettingsView />
                        </AdminLayout>
                    }
                />
                <Route
                    route={Routes.Form}
                    element={
                        <AdminLayout title="Webhooks">
                            <WebhookFormView />
                        </AdminLayout>
                    }
                />
                <Menu
                    name="webhooks.list"
                    parent={"dev-tools"}
                    element={
                        <Menu.Link
                            text="Webhooks"
                            badge={beta}
                            to={getLink(Routes.List)}
                            icon={<Menu.Link.Icon label="Webhooks" element={<WebhookIcon />} />}
                        />
                    }
                />
                <Menu
                    name="webhooks.deliveries"
                    parent="dev-tools"
                    element={
                        <Menu.Link
                            text="Webhooks Log"
                            badge={beta}
                            to={getLink(Routes.Deliveries)}
                            icon={
                                <Menu.Link.Icon
                                    label="Webhooks Log"
                                    element={<WebhookDeliveryIcon />}
                                />
                            }
                        />
                    }
                />
                <Menu
                    name="webhooks.settings"
                    parent="settings.system"
                    element={
                        <Menu.Link badge={beta} text="Webhooks" to={getLink(Routes.Settings)} />
                    }
                />
            </HasPermission>
        </AdminConfig>
    );
};
