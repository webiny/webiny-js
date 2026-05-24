import React from "react";
import { observer } from "mobx-react-lite";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/index.js";
import type { IWebhookDeliveriesPresenter } from "../abstractions.js";
import { DeliveryDetail } from "./DeliveryDetail.js";

interface DeliveryDetailPanelProps {
    presenter: IWebhookDeliveriesPresenter;
}

export const DeliveryDetailPanel = observer(function DeliveryDetailPanel({
    presenter
}: DeliveryDetailPanelProps) {
    const { vm } = presenter;

    const { showConfirmation: showResendConfirmation } = useConfirmationDialog({
        title: "Resend Delivery",
        message: "Are you sure you want to resend this delivery?"
    });

    if (!vm.selectedDelivery) {
        return null;
    }

    return (
        <div className="flex-1 overflow-auto">
            <DeliveryDetail
                delivery={vm.selectedDelivery}
                onClose={() => presenter.selectDelivery(null)}
                onResend={id => showResendConfirmation(() => presenter.resend(id))}
            />
        </div>
    );
});
