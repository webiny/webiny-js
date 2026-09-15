import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { Drawer, IconButton, MultiSelect, Select } from "@webiny/admin-ui";
import { ReactComponent as FilterIcon } from "@webiny/icons/filter_list.svg";
import type { IWebhookDeliveriesPagePresenter } from "../abstractions.js";

interface DeliveryFiltersProps {
    presenter: IWebhookDeliveriesPagePresenter;
}

const STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "delivering", label: "Delivering" },
    { value: "delivered", label: "Delivered" },
    { value: "failed", label: "Failed" }
];

export const DeliveryFilters = observer(({ presenter }: DeliveryFiltersProps) => {
    const { vm } = presenter;
    const [open, setOpen] = useState(false);

    return (
        <>
            <IconButton
                variant={vm.hasFilters ? "primary" : "ghost"}
                icon={<FilterIcon />}
                onClick={() => setOpen(true)}
                data-testid="webhooks.toggle-filters"
            />
            <Drawer
                open={open}
                onClose={() => setOpen(false)}
                modal={true}
                width={360}
                title="Filters"
                headerSeparator={true}
                footerSeparator={true}
                bodyPadding={false}
                actions={
                    <>
                        <Drawer.CancelButton
                            text="Clear all"
                            onClick={() => presenter.clearFilters()}
                        />
                        <Drawer.ConfirmButton text="Apply filters" onClick={() => setOpen(false)} />
                    </>
                }
            >
                <div className="flex flex-col gap-lg p-lg">
                    <Select
                        size={"md"}
                        label="Webhook"
                        placeholder="All webhooks"
                        value={vm.filters.webhookId ?? ""}
                        options={vm.availableWebhooks}
                        onChange={value => presenter.setWebhookFilter(value || null)}
                        displayResetAction={true}
                        onValueReset={() => presenter.setWebhookFilter(null)}
                    />
                    <Select
                        size={"md"}
                        label="Application"
                        placeholder="All apps"
                        value={vm.filters.app ?? ""}
                        options={vm.availableApps}
                        onChange={value => presenter.setAppFilter(value || null)}
                        displayResetAction={true}
                        onValueReset={() => presenter.setAppFilter(null)}
                    />
                    <Select
                        size={"md"}
                        label="Entity"
                        placeholder="All entities"
                        value={vm.filters.entity ?? ""}
                        options={vm.availableEntities}
                        onChange={value => presenter.setEntityFilter(value || null)}
                        disabled={!vm.filters.app}
                        displayResetAction={true}
                        onValueReset={() => presenter.setEntityFilter(null)}
                    />
                    <Select
                        size={"md"}
                        label="Event"
                        placeholder="All events"
                        value={vm.filters.eventName ?? ""}
                        options={vm.availableEventNames}
                        onChange={value => presenter.setEventFilter(value || null)}
                        disabled={!vm.filters.app}
                        displayResetAction={true}
                        onValueReset={() => presenter.setEventFilter(null)}
                    />
                    <MultiSelect
                        size={"md"}
                        label="Status"
                        placeholder="All statuses"
                        value={vm.filters.status}
                        options={STATUS_OPTIONS}
                        onChange={values => presenter.setStatusFilter(values)}
                    />
                </div>
            </Drawer>
        </>
    );
});
