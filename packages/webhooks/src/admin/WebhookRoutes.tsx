import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import { AdminLayout } from "@webiny/app-admin";
import { HasPermission } from "./presentation/security/HasPermission.js";
import { WebhookListView } from "./presentation/WebhookList/components/WebhookListView.js";
import { WebhookFormView } from "./presentation/WebhookForm/components/WebhookFormView.js";
import { Routes } from "./routes.js";
import { ReactComponent as Send } from "@webiny/icons/send.svg";

const { Menu, Route } = AdminConfig;

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
                    route={Routes.Form}
                    element={
                        <AdminLayout title="Webhooks">
                            <WebhookFormView />
                        </AdminLayout>
                    }
                />
                <Menu
                    name="webhooks"
                    after="settings"
                    element={
                        <Menu.Link
                            text="Webhooks"
                            to={getLink(Routes.List)}
                            icon={<Menu.Link.Icon label="Webhooks" element={<Send />} />}
                        />
                    }
                />
            </HasPermission>
        </AdminConfig>
    );
};
