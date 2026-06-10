import React from "react";
import { observer } from "mobx-react-lite";
import { Grid, MultiSelect, Select } from "@webiny/admin-ui";
import type { IWebhookDeliveriesPagePresenter } from "../abstractions.js";
import { Button } from "@webiny/admin-ui";

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
    return (
        <Grid>
            <Grid.Column span={2}>
                <Select
                    size={"md"}
                    placeholder="All webhooks"
                    value={vm.filters.webhookId ?? ""}
                    options={vm.availableWebhooks}
                    onChange={value => presenter.setWebhookFilter(value || null)}
                    displayResetAction={true}
                    onValueReset={() => presenter.setWebhookFilter(null)}
                />
            </Grid.Column>
            <Grid.Column span={2}>
                <Select
                    size={"md"}
                    placeholder="All apps"
                    value={vm.filters.app ?? ""}
                    options={vm.availableApps}
                    onChange={value => presenter.setAppFilter(value || null)}
                    displayResetAction={true}
                    onValueReset={() => presenter.setAppFilter(null)}
                />
            </Grid.Column>
            <Grid.Column span={2}>
                <Select
                    size={"md"}
                    placeholder="All entities"
                    value={vm.filters.entity ?? ""}
                    options={vm.availableEntities}
                    onChange={value => presenter.setEntityFilter(value || null)}
                    disabled={!vm.filters.app}
                    displayResetAction={true}
                    onValueReset={() => presenter.setEntityFilter(null)}
                />
            </Grid.Column>
            <Grid.Column span={2}>
                <Select
                    size={"md"}
                    placeholder="All events"
                    value={vm.filters.eventName ?? ""}
                    options={vm.availableEventNames}
                    onChange={value => presenter.setEventFilter(value || null)}
                    disabled={!vm.filters.app}
                    displayResetAction={true}
                    onValueReset={() => presenter.setEventFilter(null)}
                />
            </Grid.Column>
            <Grid.Column span={2}>
                <MultiSelect
                    size={"md"}
                    placeholder="All statuses"
                    value={vm.filters.status}
                    options={STATUS_OPTIONS}
                    onChange={values => presenter.setStatusFilter(values)}
                />
            </Grid.Column>
            <Grid.Column span={2}>
                <Button
                    variant="tertiary"
                    size="md"
                    onClick={() => presenter.clearFilters()}
                    disabled={!vm.hasFilters}
                >
                    Clear filters
                </Button>
            </Grid.Column>
        </Grid>
    );
});
