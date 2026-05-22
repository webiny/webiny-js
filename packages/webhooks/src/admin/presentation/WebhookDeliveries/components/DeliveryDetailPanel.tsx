import React from "react";
import { observer } from "mobx-react-lite";
import type { IWebhookDeliveriesPresenter } from "../abstractions.js";
import { DeliveryDetail } from "./DeliveryDetail.js";

interface DeliveryDetailPanelProps {
    presenter: IWebhookDeliveriesPresenter;
}

export const DeliveryDetailPanel = observer(function DeliveryDetailPanel({
    presenter
}: DeliveryDetailPanelProps) {
    const { vm } = presenter;

    if (!vm.selectedDelivery) {
        return null;
    }

    return (
        <div className="flex-1 overflow-auto">
            <DeliveryDetail
                delivery={vm.selectedDelivery}
                onClose={() => presenter.selectDelivery(null)}
                onResend={id => void presenter.resend(id)}
            />
        </div>
    );
});
