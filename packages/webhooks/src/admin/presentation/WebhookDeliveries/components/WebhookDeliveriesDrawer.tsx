import React, { useMemo, useEffect } from "react";
import debounce from "lodash/debounce.js";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { DataTable, Drawer, IconButton, Scrollbar, Tag, Text, TimeAgo } from "@webiny/admin-ui";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/index.js";
import { ReactComponent as ReplayIcon } from "@webiny/icons/replay.svg";
import { WebhookDeliveriesPresenterFeature } from "../feature.js";
import { ListWebhookDeliveriesFeature } from "~/admin/features/listWebhookDeliveries/feature.js";
import { ResendWebhookDeliveryFeature } from "~/admin/features/resendWebhookDelivery/feature.js";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import { DeliveryDetailPanel } from "./DeliveryDetailPanel.js";
import { statusVariant } from "./statusVariant.js";

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

    const columns = useMemo(
        () => ({
            eventType: {
                header: "Event",
                size: 180
            },
            status: {
                header: "Status",
                cell: (row: WebhookDelivery) => (
                    <Tag variant={statusVariant(row.status)} content={row.status} />
                ),
                size: 100
            },
            responseStatus: {
                header: "HTTP",
                cell: (row: WebhookDelivery) => (
                    <Text size="sm">
                        {row.responseStatus !== null ? String(row.responseStatus) : "—"}
                    </Text>
                ),
                size: 60
            },
            createdOn: {
                header: "Created",
                cell: (row: WebhookDelivery) => <TimeAgo datetime={row.createdOn} />,
                enableSorting: true,
                size: 120
            },
            actions: {
                header: " ",
                cell: (row: WebhookDelivery) => (
                    <IconButton
                        icon={<ReplayIcon />}
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                            e.stopPropagation();
                            showResendConfirmation(() => presenter.resend(row.id));
                        }}
                        aria-label="Resend delivery"
                    />
                ),
                size: 60,
                enableSorting: false,
                enableHiding: false,
                enableResizing: false
            }
        }),
        [presenter]
    );

    return (
        <Drawer
            open={open}
            onOpenChange={isOpen => !isOpen && onClose()}
            title="Delivery Log"
            modal={true}
            width="900px"
            bodyPadding={false}
        >
            <div className="flex h-full">
                <div
                    className={
                        vm.selectedDelivery
                            ? "flex-[1.5] border-r-sm border-neutral-muted overflow-hidden"
                            : "flex-1 overflow-hidden"
                    }
                >
                    <Scrollbar onScrollFrame={scrollFrame => loadMoreOnScroll({ scrollFrame })}>
                        <DataTable<WebhookDelivery>
                            columns={columns}
                            data={vm.list.rows}
                            loading={vm.list.pagination.loading && vm.list.rows.length === 0}
                            onToggleRow={(row: WebhookDelivery) => presenter.selectDelivery(row)}
                        />
                    </Scrollbar>
                </div>
                <DeliveryDetailPanel presenter={presenter} />
            </div>
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
