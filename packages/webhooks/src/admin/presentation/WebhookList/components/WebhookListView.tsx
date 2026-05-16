import React, { useMemo, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { useRouter } from "@webiny/app-admin";
import { Button, Heading, Separator } from "@webiny/admin-ui";
import { WebhookListPresenterFeature } from "../feature.js";
import { ListWebhooksFeature } from "~/admin/features/ListWebhooks/feature.js";
import { DeleteWebhookFeature } from "~/admin/features/deleteWebhook/feature.js";
import { TriggerWebhookFeature } from "~/admin/features/triggerWebhook/feature.js";
import { WebhookPermissionsFeature } from "~/admin/features/permissions/feature.js";
import { Routes } from "~/admin/routes.js";

const WebhookListViewInner = observer(function WebhookListViewInner() {
    const { presenter } = useFeature(WebhookListPresenterFeature);
    const { goToRoute } = useRouter();

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    const { vm } = presenter;

    return (
        <div className="flex flex-col h-main-content">
            <div className="flex items-center justify-between py-sm px-md">
                <Heading level={5}>Webhooks</Heading>
                {vm.permissions.canCreate && (
                    <Button variant="primary" onClick={() => goToRoute(Routes.Form, { id: "new" })}>
                        Create Webhook
                    </Button>
                )}
            </div>
            <Separator />
            <div className="flex-1 overflow-auto">
                {/* DataTable columns: name, endpointUrl, enabled, createdOn. */}
                {/* Row actions: Edit, Trigger, Delete. */}
            </div>
        </div>
    );
});

export const WebhookListView = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        ListWebhooksFeature.register(child);
        DeleteWebhookFeature.register(child);
        TriggerWebhookFeature.register(child);
        WebhookPermissionsFeature.register(child);
        WebhookListPresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <WebhookListViewInner />
        </DiContainerProvider>
    );
};
