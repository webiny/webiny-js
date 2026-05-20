import React, { useMemo, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { Accordion, Button, Heading, Skeleton, Text } from "@webiny/admin-ui";
import { ListWebhookDeliveriesFeature } from "~/admin/features/listWebhookDeliveries/feature.js";
import { ListAvailableEventsFeature } from "~/admin/features/listAvailableEvents/feature.js";
import { ResendWebhookDeliveryFeature } from "~/admin/features/resendWebhookDelivery/feature.js";
import { WebhookDeliveriesPagePresenterFeature } from "../feature.js";
import { DeliveryAccordionRow } from "~/admin/presentation/WebhookDeliveries/components/DeliveryAccordionRow.js";
import { DeliveryFilters } from "./DeliveryFilters.js";
import type { WebhookDelivery } from "~/admin/shared/types.js";

const WebhookDeliveriesPageInner = observer(function WebhookDeliveriesPageInner() {
    const { presenter } = useFeature(WebhookDeliveriesPagePresenterFeature);

    useEffect(() => {
        void presenter.actions.init();
    }, [presenter]);

    const { vm } = presenter;

    if (vm.loading && vm.list.rows.length === 0) {
        return (
            <div className="flex flex-col gap-sm p-md">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    if (vm.error) {
        return (
            <div className="flex flex-col items-center gap-sm p-md">
                <Text>{vm.error}</Text>
                <Button variant="secondary" onClick={() => void presenter.actions.init()}>
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col p-md gap-md">
            <Heading level={4}>Delivery Log</Heading>
            <DeliveryFilters vm={vm} actions={presenter.actions} />
            {vm.list.rows.length === 0 ? (
                <div className="flex justify-center py-xl">
                    <Text className="text-neutral-strong">No deliveries found.</Text>
                </div>
            ) : (
                <>
                    <Accordion variant="underline">
                        {vm.list.rows.map((delivery: WebhookDelivery) => (
                            <DeliveryAccordionRow
                                key={delivery.id}
                                delivery={delivery}
                                open={vm.expandedDeliveryId === delivery.id}
                                onOpenChange={open =>
                                    presenter.actions.expandDelivery(open ? delivery.id : null)
                                }
                                onResend={id => void presenter.actions.resend(id)}
                            />
                        ))}
                    </Accordion>
                    {vm.list.pagination.hasMore && (
                        <div className="flex justify-center pt-sm">
                            <Button
                                variant="secondary"
                                onClick={() => void presenter.actions.loadMore()}
                                disabled={vm.list.pagination.loadingMore}
                            >
                                {vm.list.pagination.loadingMore ? "Loading…" : "Load more"}
                            </Button>
                        </div>
                    )}
                </>
            )}
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
        WebhookDeliveriesPagePresenterFeature.register(child);
        return child;
    }, [container]);

    return (
        <DiContainerProvider container={scopedContainer}>
            <WebhookDeliveriesPageInner />
        </DiContainerProvider>
    );
};
