import React from "react";
import { observer } from "mobx-react-lite";
import { Accordion, Text } from "@webiny/admin-ui";
import { DeliveryAccordionRow } from "~/admin/presentation/WebhookDeliveries/components/DeliveryAccordionRow.js";
import { LoadMoreButton } from "./LoadMoreButton.js";
import type { IWebhookDeliveriesPagePresenter } from "../abstractions.js";
import type { WebhookDelivery } from "~/admin/shared/types.js";

interface DeliveryListProps {
    presenter: IWebhookDeliveriesPagePresenter;
}

export const DeliveryList = observer(function DeliveryList({ presenter }: DeliveryListProps) {
    const { vm } = presenter;

    if (vm.list.rows.length === 0) {
        return (
            <div className="flex justify-center py-xl">
                <Text className="text-neutral-strong">No deliveries found.</Text>
            </div>
        );
    }

    return (
        <>
            <Accordion variant="underline">
                {vm.list.rows.map((delivery: WebhookDelivery) => (
                    <DeliveryAccordionRow
                        key={delivery.id}
                        delivery={delivery}
                        open={vm.expandedDeliveryId === delivery.id}
                        resending={vm.resendingIds.has(delivery.id)}
                        onOpenChange={open => presenter.expandDelivery(open ? delivery.id : null)}
                        onResend={id => void presenter.resend(id)}
                    />
                ))}
            </Accordion>
            <LoadMoreButton presenter={presenter} />
        </>
    );
});
