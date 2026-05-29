import React, { useMemo, useState } from "react";
import debounce from "lodash/debounce.js";
import { observer } from "mobx-react-lite";
import { Accordion, Scrollbar, Skeleton, Text } from "@webiny/admin-ui";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/index.js";
import { DeliveryAccordionRow } from "./DeliveryAccordionRow.js";
import { DeliveryBottomInfoBar } from "./DeliveryBottomInfoBar.js";
import type { IWebhookDeliveriesPagePresenter } from "../abstractions.js";
import type { WebhookDelivery } from "~/admin/shared/types.js";

interface ExpandedState {
    expandedId: string | null;
    toggle(id: string): void;
}

function useExpandedState(): ExpandedState {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    return {
        expandedId,
        toggle(id: string) {
            setExpandedId(prev => (prev === id ? null : id));
        }
    };
}

interface DeliveryListProps {
    presenter: IWebhookDeliveriesPagePresenter;
}

export const DeliveryList = observer(({ presenter }: DeliveryListProps) => {
    const { vm } = presenter;
    const expanded = useExpandedState();

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
                            open={expanded.expandedId === delivery.id}
                            resending={vm.resendingIds.has(delivery.id)}
                            onOpenChange={() => expanded.toggle(delivery.id)}
                            onResend={id => showResendConfirmation(() => presenter.resend(id))}
                        />
                    ))}
                </Accordion>
                {vm.list.pagination.loadingMore ? (
                    <div className="flex flex-col gap-sm p-md">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ) : null}
            </Scrollbar>
            <DeliveryBottomInfoBar presenter={presenter} />
        </div>
    );
});
