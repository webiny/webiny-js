import React, { useMemo, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature, useRoute } from "@webiny/app";
import { Separator } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";
import { Button, Heading, Text } from "@webiny/admin-ui";
import { ListWebhookDeliveriesFeature } from "~/admin/features/listWebhookDeliveries/feature.js";
import { ListAvailableEventsFeature } from "~/admin/features/listAvailableEvents/feature.js";
import { ResendWebhookDeliveryFeature } from "~/admin/features/resendWebhookDelivery/feature.js";
import { ListWebhooksFeature } from "~/admin/features/ListWebhooks/feature.js";
import { WebhookDeliveriesPagePresenterFeature } from "../feature.js";
import { Routes } from "~/admin/routes.js";
import { DeliveryFilters } from "./DeliveryFilters.js";
import { DeliveryList } from "./DeliveryList.js";
import { WebhookDefinitionsButton } from "~/admin/presentation/WebhookDeliveriesPage/components/WebhookDefinitionsButton.js";

const Loader = () => {
    return (
        <div className="flex flex-col gap-sm p-md">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
        </div>
    );
};

const WebhookDeliveriesPageInner = observer(function WebhookDeliveriesPageInner() {
    const { presenter } = useFeature(WebhookDeliveriesPagePresenterFeature);
    const { route } = useRoute(Routes.Deliveries);
    const webhookId = route?.params?.webhookId;

    useEffect(() => {
        void presenter.init(webhookId);
    }, [presenter, webhookId]);

    const { vm } = presenter;

    if (vm.error) {
        return (
            <div className="flex flex-col items-center gap-sm p-md">
                <Text>{vm.error}</Text>
                <Button variant="secondary" onClick={() => void presenter.init()}>
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-main-content">
            <div className="flex items-center justify-between py-sm px-md">
                <Heading level={5}>Webhook Deliveries</Heading>
                <WebhookDefinitionsButton />
            </div>
            <Separator />
            <div className={"p-sm"}>
                <DeliveryFilters presenter={presenter} />
            </div>
            <Separator />
            {vm.loading ? <Loader /> : <DeliveryList presenter={presenter} />}
        </div>
    );
});

export const WebhookDeliveriesPage = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        ListWebhookDeliveriesFeature.register(child);
        ListAvailableEventsFeature.register(child);
        ResendWebhookDeliveryFeature.register(child);
        ListWebhooksFeature.register(child);
        WebhookDeliveriesPagePresenterFeature.register(child);
        return child;
    }, [container]);

    return (
        <DiContainerProvider container={scopedContainer}>
            <WebhookDeliveriesPageInner />
        </DiContainerProvider>
    );
};
