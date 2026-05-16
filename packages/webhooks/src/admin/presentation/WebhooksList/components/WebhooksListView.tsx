import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { DataTable, DropdownMenu, IconButton, OptionsIcon, Tag } from "@webiny/admin-ui";
import type { DataTableColumns } from "@webiny/admin-ui";
import type { IWebhook } from "~/admin/domain/types.js";
import { useWebhooksList } from "../useWebhooksList.js";

type WebhookRow = IWebhook & { actions?: never };

export const WebhooksListView = observer(() => {
    const { presenter } = useWebhooksList();

    useEffect(() => {
        presenter.load();
    }, []);

    const vm = presenter.vm;

    const columns: DataTableColumns<WebhookRow> = {
        name: {
            header: "Name",
            cell: row => row.name,
            size: 200
        },
        endpointUrl: {
            header: "Endpoint URL",
            cell: row => row.endpointUrl,
            size: 320,
            truncate: true
        },
        enabled: {
            header: "Status",
            cell: row => (
                <Tag
                    content={row.enabled ? "Enabled" : "Disabled"}
                    variant={row.enabled ? "success" : "neutral-light"}
                />
            ),
            size: 100
        },
        events: {
            header: "Events",
            cell: row => row.events.length,
            size: 80
        },
        actions: {
            header: "",
            cell: () => (
                <DropdownMenu
                    trigger={<IconButton icon={<OptionsIcon />} variant="ghost" size="sm" />}
                >
                    <DropdownMenu.Item text="Edit" />
                    <DropdownMenu.Item text="Trigger test" />
                    <DropdownMenu.Item text="Delete" />
                </DropdownMenu>
            ),
            size: 60,
            enableHiding: false,
            enableResizing: false
        }
    };

    return <DataTable<WebhookRow> columns={columns} data={vm.items} loading={vm.loading} />;
});
