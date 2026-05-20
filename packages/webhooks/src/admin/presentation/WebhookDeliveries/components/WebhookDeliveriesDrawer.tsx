import React, { useMemo, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { DataTable, Drawer, IconButton, Tag, Text, TimeAgo } from "@webiny/admin-ui";
import { ReactComponent as ReplayIcon } from "@webiny/icons/replay.svg";
import { WebhookDeliveriesPresenterFeature } from "../feature.js";
import { ListWebhookDeliveriesFeature } from "~/admin/features/listWebhookDeliveries/feature.js";
import { ResendWebhookDeliveryFeature } from "~/admin/features/resendWebhookDelivery/feature.js";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import { DeliveryDetail } from "./DeliveryDetail.js";

interface WebhookDeliveriesDrawerProps {
    webhookId: string;
    open: boolean;
    onClose: () => void;
}

const statusVariant = (status: string) => {
    switch (status) {
        case "delivered":
            return "success" as const;
        case "failed":
            return "destructive" as const;
        default:
            return "warning" as const;
    }
};

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
                cell: (row: WebhookDelivery) =>
                    row.createdOn ? <TimeAgo datetime={row.createdOn} /> : <Text size="sm">—</Text>,
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
                            void presenter.actions.resend(row.id);
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
        [presenter.actions]
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
                            ? "flex-[1.5] border-r-sm border-neutral-muted overflow-auto"
                            : "flex-1 overflow-auto"
                    }
                >
                    <DataTable<WebhookDelivery>
                        columns={columns}
                        data={vm.list.rows}
                        loading={vm.list.pagination.loading}
                        onToggleRow={(row: WebhookDelivery) =>
                            presenter.actions.selectDelivery(row)
                        }
                    />
                </div>
                {vm.selectedDelivery && (
                    <div className="flex-1 overflow-auto">
                        <DeliveryDetail
                            delivery={vm.selectedDelivery}
                            onClose={() => presenter.actions.selectDelivery(null)}
                            onResend={id => void presenter.actions.resend(id)}
                        />
                    </div>
                )}
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
