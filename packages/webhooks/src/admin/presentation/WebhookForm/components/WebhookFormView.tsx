import React, { useMemo, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { useRouter } from "@webiny/app-admin";
import { Button, Heading, OverlayLoader, Separator } from "@webiny/admin-ui";
import { WebhookFormPresenterFeature } from "../feature.js";
import { GetWebhookFeature } from "~/admin/features/getWebhook/feature.js";
import { CreateWebhookFeature } from "~/admin/features/createWebhook/feature.js";
import { UpdateWebhookFeature } from "~/admin/features/updateWebhook/feature.js";
import { DeleteWebhookFeature } from "~/admin/features/deleteWebhook/feature.js";
import { ListAvailableEventsFeature } from "~/admin/features/listAvailableEvents/feature.js";
import { WebhookPermissionsFeature } from "~/admin/features/permissions/feature.js";
import { Routes } from "~/admin/routes.js";

const WebhookFormViewInner = observer(function WebhookFormViewInner() {
    const { presenter } = useFeature(WebhookFormPresenterFeature);
    const { params, navigate } = useRouter();
    const id = params.id as string;

    useEffect(() => {
        void presenter.init(id);
    }, [presenter, id]);

    const { vm, actions } = presenter;

    if (vm.loading) {
        return <OverlayLoader />;
    }

    return (
        <div className="flex flex-col h-main-content">
            <div className="flex items-center justify-between py-sm px-md">
                <Heading level={5}>
                    {vm.isNew ? "Create Webhook" : (vm.webhook?.name ?? "Edit Webhook")}
                </Heading>
                <div className="flex gap-sm">
                    {!vm.isNew && (
                        <Button variant="secondary" onPress={() => actions.openDeliveries()}>
                            Deliveries
                        </Button>
                    )}
                    <Button variant="secondary" onPress={() => navigate(Routes.List)}>
                        Cancel
                    </Button>
                    {vm.permissions.canEdit && (
                        <Button
                            variant="primary"
                            onPress={() => void actions.save()}
                            disabled={vm.saving}
                        >
                            {vm.saving ? "Saving..." : "Save"}
                        </Button>
                    )}
                </div>
            </div>
            <Separator />
            <div className="flex-1 overflow-auto p-md">
                {/* FormModel renderer will be wired here. */}
            </div>
        </div>
    );
});

export const WebhookFormView = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        GetWebhookFeature.register(child);
        CreateWebhookFeature.register(child);
        UpdateWebhookFeature.register(child);
        DeleteWebhookFeature.register(child);
        ListAvailableEventsFeature.register(child);
        WebhookPermissionsFeature.register(child);
        WebhookFormPresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <WebhookFormViewInner />
        </DiContainerProvider>
    );
};
