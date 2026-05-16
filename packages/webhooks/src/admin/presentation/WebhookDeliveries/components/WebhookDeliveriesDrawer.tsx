import React, { useMemo, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { Drawer, Heading } from "@webiny/admin-ui";
import { WebhookDeliveriesPresenterFeature } from "../feature.js";
import { ListWebhookDeliveriesFeature } from "~/admin/features/listWebhookDeliveries/feature.js";
import { ResendWebhookDeliveryFeature } from "~/admin/features/resendWebhookDelivery/feature.js";

interface WebhookDeliveriesDrawerProps {
    webhookId: string;
    open: boolean;
    onClose: () => void;
}

const WebhookDeliveriesDrawerInner = observer(function WebhookDeliveriesDrawerInner({
    webhookId,
    open,
    onClose
}: WebhookDeliveriesDrawerProps) {
    const { presenter } = useFeature(WebhookDeliveriesPresenterFeature);

    useEffect(() => {
        if (open) {
            presenter.init(webhookId);
        }
    }, [presenter, webhookId, open]);

    return (
        <Drawer open={open} onOpenChange={isOpen => !isOpen && onClose()}>
            <Drawer.Content>
                <Drawer.Header>
                    <Heading level={5}>Delivery Log</Heading>
                </Drawer.Header>
                <Drawer.Body>
                    {/* Delivery list with status badges, resend buttons. */}
                    {/* Each row: eventType, status, createdOn, responseStatus. */}
                    {/* Selected delivery detail: payload, headers, response. */}
                </Drawer.Body>
            </Drawer.Content>
        </Drawer>
    );
});

export const WebhookDeliveriesDrawer = (props: WebhookDeliveriesDrawerProps) => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        ListWebhookDeliveriesFeature.register(child);
        ResendWebhookDeliveryFeature.register(child);
        WebhookDeliveriesPresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <WebhookDeliveriesDrawerInner {...props} />
        </DiContainerProvider>
    );
};
