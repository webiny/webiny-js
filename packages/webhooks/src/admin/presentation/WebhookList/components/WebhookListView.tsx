import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { Heading, Separator } from "@webiny/admin-ui";
import { WebhookListPresenterFeature } from "../feature.js";
import { ListWebhooksFeature } from "~/admin/features/ListWebhooks/feature.js";
import { DeleteWebhookFeature } from "~/admin/features/deleteWebhook/feature.js";
import { TriggerWebhookFeature } from "~/admin/features/triggerWebhook/feature.js";
import { WebhookPermissionsFeature } from "~/admin/features/permissions/feature.js";
import { CreateWebhookButton } from "./CreateWebhookButton.js";
import { WebhookListContent } from "./WebhookListContent.js";
import { WebhookDeliveriesButton } from "~/admin/presentation/WebhookList/components/WebhookDeliveriesButton.js";

const WebhookListViewInner = observer(function WebhookListViewInner() {
    const { presenter } = useFeature(WebhookListPresenterFeature);

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    return (
        <div className="flex flex-col h-main-content">
            <div className="flex items-center justify-between py-sm px-md">
                <Heading level={5}>Webhooks</Heading>
                <div className={"flex gap-sm"}>
                    <WebhookDeliveriesButton />
                    <CreateWebhookButton />
                </div>
            </div>
            <Separator />
            <WebhookListContent presenter={presenter} />
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
