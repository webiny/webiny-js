import React, { useCallback, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { useRouter } from "@webiny/app-admin";
import type { DataTableSorting, OnDataTableSortingChange } from "@webiny/admin-ui";
import {
    Button,
    DataTable,
    DropdownMenu,
    Heading,
    IconButton,
    Separator,
    Tag,
    Text,
    TimeAgo
} from "@webiny/admin-ui";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin/hooks/index.js";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { WebhookListPresenterFeature } from "../feature.js";
import { ListWebhooksFeature } from "~/admin/features/ListWebhooks/feature.js";
import { DeleteWebhookFeature } from "~/admin/features/deleteWebhook/feature.js";
import { TriggerWebhookFeature } from "~/admin/features/triggerWebhook/feature.js";
import { WebhookPermissionsFeature } from "~/admin/features/permissions/feature.js";
import { Routes } from "~/admin/routes.js";
import type { Webhook } from "~/admin/shared/types.js";
import { ReactComponent as Edit } from "@webiny/icons/edit.svg";
import { ReactComponent as Delete } from "@webiny/icons/delete.svg";
import { ReactComponent as Trigger } from "@webiny/icons/send.svg";

const WebhookListViewInner = observer(function WebhookListViewInner() {
    const { presenter } = useFeature(WebhookListPresenterFeature);
    const { goToRoute } = useRouter();

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    const { vm } = presenter;

    const { showSnackbar } = useSnackbar();

    const { showConfirmation: showDeleteConfirmation } = useConfirmationDialog({
        title: "Delete Webhook",
        message: "Are you sure you want to delete this webhook?"
    });

    const sorting: DataTableSorting = useMemo(() => {
        const sort = vm.list.sort;
        if (!sort || !sort.field) {
            return [];
        }
        return [{ id: sort.field, desc: sort.direction === "DESC" }];
    }, [vm.list.sort]);

    const onSortingChange: OnDataTableSortingChange = useCallback(
        updater => {
            const next = typeof updater === "function" ? updater(sorting) : updater;
            if (next.length > 0) {
                const { id, desc } = next[0];
                presenter.actions.sort.set(id, desc ? "DESC" : "ASC");
            }
        },
        [sorting, presenter.actions.sort]
    );

    const columns = useMemo(
        () => ({
            name: {
                header: "Name",
                cell: (row: Webhook) => (
                    <Text
                        className="cursor-pointer text-primary hover:underline"
                        onClick={() => goToRoute(Routes.Form, { id: row.id })}
                    >
                        {row.name}
                    </Text>
                ),
                enableSorting: true,
                size: 200
            },
            endpointUrl: {
                header: "Endpoint",
                cell: (row: Webhook) => (
                    <Text className="font-mono text-sm truncate">{row.endpointUrl}</Text>
                ),
                size: 250
            },
            enabled: {
                header: "Status",
                cell: (row: Webhook) => (
                    <Tag
                        variant={row.enabled ? "success" : "neutral-muted"}
                        content={row.enabled ? "Active" : "Disabled"}
                    />
                ),
                enableSorting: true,
                size: 100
            },
            createdOn: {
                header: "Created",
                cell: (row: Webhook) =>
                    row.createdOn ? <TimeAgo datetime={row.createdOn} /> : <Text size="sm">—</Text>,
                enableSorting: true,
                size: 120
            },
            actions: {
                header: " ",
                cell: (row: Webhook) => (
                    <DropdownMenu
                        trigger={
                            <IconButton
                                icon={<MoreVerticalIcon />}
                                variant="ghost"
                                size="sm"
                                aria-label="Actions"
                            />
                        }
                    >
                        <DropdownMenu.Item
                            icon={<Edit />}
                            onSelect={() => goToRoute(Routes.Form, { id: row.id })}
                            text={"Edit"}
                        />
                        {vm.permissions.canEdit && (
                            <DropdownMenu.Item
                                icon={<Trigger />}
                                onSelect={() => {
                                    void presenter.actions.triggerWebhook(row.id).then(() => {
                                        showSnackbar("Test event triggered.");
                                    });
                                }}
                                text={"Trigger Test"}
                            />
                        )}
                        {vm.permissions.canDelete && (
                            <>
                                <DropdownMenu.Separator />
                                <DropdownMenu.Item
                                    onSelect={() => {
                                        showDeleteConfirmation(() =>
                                            presenter.actions.deleteWebhook(row.id)
                                        );
                                    }}
                                    icon={<Delete />}
                                    text={"Delete"}
                                />
                            </>
                        )}
                    </DropdownMenu>
                ),
                size: 56,
                enableSorting: false,
                enableHiding: false,
                enableResizing: false
            }
        }),
        [vm.permissions, presenter.actions, goToRoute, showDeleteConfirmation, showSnackbar]
    );

    return (
        <div className="flex flex-col h-main-content">
            <div className="flex items-center justify-between py-sm px-md">
                <Heading level={5}>Webhooks</Heading>
                {vm.permissions.canCreate && (
                    <Button variant="primary" onClick={() => goToRoute(Routes.Form, { id: "new" })}>
                        Create Webhook
                    </Button>
                )}
            </div>
            <Separator />
            <div className="flex-1 overflow-auto">
                {!vm.list.pagination.loading && vm.list.rows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-md">
                        <Text className="text-neutral-strong">No webhooks found.</Text>
                        {vm.permissions.canCreate && (
                            <Button
                                variant="primary"
                                onClick={() => goToRoute(Routes.Form, { id: "new" })}
                            >
                                Create Webhook
                            </Button>
                        )}
                    </div>
                ) : (
                    <DataTable<Webhook>
                        columns={columns}
                        data={vm.list.rows}
                        loading={vm.list.pagination.loading}
                        sorting={sorting}
                        onSortingChange={onSortingChange}
                        stickyHeader
                    />
                )}
            </div>
        </div>
    );
});

export const WebhookListView = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        ListWebhooksFeature.register(child);
        DeleteWebhookFeature.register(child);
        TriggerWebhookFeature.register(child);
        WebhookPermissionsFeature.register(child);
        WebhookListPresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <WebhookListViewInner />
        </DiContainerProvider>
    );
};
