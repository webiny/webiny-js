import React from "react";
import { observer } from "mobx-react-lite";
import { Loader, Separator, Text } from "@webiny/admin-ui";
import type { IWebhookDeliveriesPagePresenter } from "../abstractions.js";

interface DeliveryBottomInfoBarProps {
    presenter: IWebhookDeliveriesPagePresenter;
}

export const DeliveryBottomInfoBar = observer(function DeliveryBottomInfoBar({
    presenter
}: DeliveryBottomInfoBarProps) {
    const { vm } = presenter;
    const { pagination } = vm.list;

    if (pagination.loading && vm.list.rows.length === 0) {
        return null;
    }

    return (
        <div className="sticky bottom-0 z-5 bg-neutral-base w-full transform translate-z-0 overflow-hidden">
            <Separator />
            <div className="h-xl px-md py-sm flex items-center justify-between">
                <DeliveryMeta
                    loading={pagination.loading}
                    currentCount={pagination.currentCount}
                    totalCount={pagination.totalCount}
                />
                <DeliveryLoadingStatus loading={pagination.loadingMore} />
            </div>
        </div>
    );
});

interface DeliveryMetaProps {
    loading: boolean;
    currentCount: number;
    totalCount: number;
}

const DeliveryMeta = ({ loading, currentCount, totalCount }: DeliveryMetaProps) => {
    if (loading) {
        return null;
    }

    const label = totalCount === 1 ? "delivery" : "deliveries";

    return (
        <Text size="sm" as="div" className="text-neutral-strong">
            {`Showing ${currentCount} out of ${totalCount} ${label}.`}
        </Text>
    );
};

interface DeliveryLoadingStatusProps {
    loading: boolean;
}

const DeliveryLoadingStatus = ({ loading }: DeliveryLoadingStatusProps) => {
    if (!loading) {
        return null;
    }

    return (
        <div className="flex items-center gap-sm">
            <Text size="sm" as="div" className="text-neutral-strong">
                Loading more deliveries...
            </Text>
            <Loader size="xs" />
        </div>
    );
};
