import React from "react";
import {
    AdminConfig,
    AdminLayout,
    HasPermission,
    RegisterFeature,
    useRouter
} from "@webiny/app-admin";
import { ReactComponent as WebhookIcon } from "@webiny/icons/webhook.svg";
import { ListWebhooksFeature } from "./features/ListWebhooks/feature.js";
import { WebhookPermissionsFeature } from "./features/permissions/feature.js";
import { WebhooksListFeature } from "./presentation/WebhooksList/feature.js";
import { WebhooksListView } from "./presentation/WebhooksList/components/WebhooksListView.js";
import { Routes } from "./routes.js";
import { SecurityPermission } from "./SecurityPermission.js";

const { Menu, Route } = AdminConfig;

export const Extension = () => {
    const router = useRouter();

    return (
        <>
            <RegisterFeature feature={WebhookPermissionsFeature} />
            <RegisterFeature feature={ListWebhooksFeature} />
            <RegisterFeature feature={WebhooksListFeature} />
            <SecurityPermission />
            <AdminConfig>
                <HasPermission name="webhooks.webhook">
                    <Menu
                        name="webhooks"
                        pinnable
                        element={
                            <Menu.Link
                                text="Webhooks"
                                icon={<Menu.Link.Icon element={<WebhookIcon />} label="Webhooks" />}
                                to={router.getLink(Routes.List)}
                            />
                        }
                    />
                    <Route
                        route={Routes.List}
                        element={
                            <AdminLayout title="Webhooks">
                                <WebhooksListView />
                            </AdminLayout>
                        }
                    />
                </HasPermission>
            </AdminConfig>
        </>
    );
};
