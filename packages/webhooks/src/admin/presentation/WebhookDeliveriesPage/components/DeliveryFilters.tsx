import React from "react";
import { observer } from "mobx-react-lite";
import { MultiSelect, Select } from "@webiny/admin-ui";
import type {
    IWebhookDeliveriesPageViewModel,
    IWebhookDeliveriesPageActions
} from "../abstractions.js";

interface DeliveryFiltersProps {
    vm: IWebhookDeliveriesPageViewModel;
    actions: IWebhookDeliveriesPageActions;
}

const STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "delivering", label: "Delivering" },
    { value: "delivered", label: "Delivered" },
    { value: "failed", label: "Failed" }
];

export const DeliveryFilters = observer(function DeliveryFilters({
    vm,
    actions
}: DeliveryFiltersProps) {
    return (
        <div className="flex items-center gap-sm flex-wrap py-sm">
            <Select
                placeholder="All apps"
                value={vm.filters.app ?? ""}
                options={vm.availableApps}
                onChange={value => actions.setAppFilter(value || null)}
                displayResetAction={true}
                onValueReset={() => actions.setAppFilter(null)}
            />
            <Select
                placeholder="All entities"
                value={vm.filters.entity ?? ""}
                options={vm.availableEntities}
                onChange={value => actions.setEntityFilter(value || null)}
                disabled={!vm.filters.app}
                displayResetAction={true}
                onValueReset={() => actions.setEntityFilter(null)}
            />
            <Select
                placeholder="All events"
                value={vm.filters.eventName ?? ""}
                options={vm.availableEventNames}
                onChange={value => actions.setEventFilter(value || null)}
                disabled={!vm.filters.app}
                displayResetAction={true}
                onValueReset={() => actions.setEventFilter(null)}
            />
            <MultiSelect
                placeholder="All statuses"
                value={vm.filters.status}
                options={STATUS_OPTIONS}
                onChange={values => actions.setStatusFilter(values)}
            />
        </div>
    );
});
