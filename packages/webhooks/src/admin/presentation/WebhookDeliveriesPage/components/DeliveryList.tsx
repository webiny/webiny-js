import React, { useMemo } from "react";
import debounce from "lodash/debounce.js";
import { observer } from "mobx-react-lite";
import { Accordion, Scrollbar, Text } from "@webiny/admin-ui";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/index.js";
import { DeliveryAccordionRow } from "./DeliveryAccordionRow.js";
import { DeliveryBottomInfoBar } from "./DeliveryBottomInfoBar.js";
import type { IWebhookDeliveriesPagePresenter } from "../abstractions.js";
import type { WebhookDelivery } from "~/admin/shared/types.js";

interface DeliveryListProps {
    presenter: IWebhookDeliveriesPagePresenter;
}

export const DeliveryList = observer(function DeliveryList({ presenter }: DeliveryListProps) {
    const { vm } = presenter;

    const { showConfirmation: showResendConfirmation } = useConfirmationDialog({
        title: "Resend Delivery",
        message: "Are you sure you want to resend this delivery?"
    });

    const loadMoreOnScroll = useMemo(
        () =>
            debounce(async ({ scrollFrame }: { scrollFrame: { top: number } }) => {
                if (scrollFrame.top > 0.8) {
                    await presenter.loadMore();
                }
            }, 200),
        [presenter]
    );

    if (vm.list.rows.length === 0 && !vm.loading) {
        return (
            <div className="flex justify-center py-xl">
                <Text className="text-neutral-strong">No deliveries found.</Text>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-hidden relative">
            <Scrollbar onScrollFrame={scrollFrame => loadMoreOnScroll({ scrollFrame })}>
                <Accordion variant="underline">
                    {vm.list.rows.map((delivery: WebhookDelivery) => (
                        <DeliveryAccordionRow
                            key={delivery.id}
                            delivery={delivery}
                            open={vm.expandedDeliveryId === delivery.id}
                            resending={vm.resendingIds.has(delivery.id)}
                            onOpenChange={open =>
                                presenter.expandDelivery(open ? delivery.id : null)
                            }
                            onResend={id => showResendConfirmation(() => presenter.resend(id))}
                        />
                    ))}
                </Accordion>
            </Scrollbar>
            <DeliveryBottomInfoBar presenter={presenter} />
        </div>
    );
});
