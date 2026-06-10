import React, { useCallback, useMemo } from "react";
import debounce from "lodash/debounce.js";
import { observer } from "mobx-react-lite";
import { useRouter } from "@webiny/app-admin";
import type { DataTableSorting, OnDataTableSortingChange } from "@webiny/admin-ui";
import {
    Button,
    DataTable,
    DropdownMenu,
    IconButton,
    Scrollbar,
    Tag,
    Text,
    TimeAgo
} from "@webiny/admin-ui";
import { useToast } from "@webiny/admin-ui";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/index.js";
import { HasPermission } from "~/admin/presentation/security/HasPermission.js";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as Edit } from "@webiny/icons/edit.svg";
import { ReactComponent as Delete } from "@webiny/icons/delete.svg";
import { ReactComponent as WebhookIcon } from "@webiny/icons/webhook.svg";
import { CreateWebhookButton } from "./CreateWebhookButton.js";
import { Routes } from "~/admin/routes.js";
import type { IWebhookListPresenter } from "../abstractions.js";
import type { Webhook } from "~/admin/shared/types.js";

interface WebhookListContentProps {
    presenter: IWebhookListPresenter;
}

export const WebhookListContent = observer(function WebhookListContent({
    presenter
}: WebhookListContentProps) {
    const { vm } = presenter;
    const { goToRoute } = useRouter();
    const toast = useToast();

    const { showConfirmation: showDeleteConfirmation } = useConfirmationDialog({
        title: "Delete Webhook",
        message: "Are you sure you want to delete this webhook?"
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
                presenter.sort.set(id, desc ? "DESC" : "ASC");
            }
        },
        [sorting, presenter.sort]
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
            deliveries: {
                header: "Deliveries",
                truncate: false,
                cell: (row: Webhook) => {
                    return (
                        <Button
                            variant={"secondary"}
                            onClick={() => {
                                goToRoute(Routes.Deliveries, { webhookId: row.id });
                            }}
                        >
                            Deliveries
                        </Button>
                    );
                }
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
                            onClick={() => goToRoute(Routes.Form, { id: row.id })}
                            text={"Edit"}
                        />
                        <HasPermission entity="webhook" action="edit">
                            <DropdownMenu.Item
                                icon={<WebhookIcon />}
                                onClick={() => {
                                    void presenter.triggerWebhook(row.id).then(() => {
                                        toast.showSuccessToast({ title: "Test event triggered!" });
                                    });
                                }}
                                text={"Trigger Test"}
                            />
                        </HasPermission>
                        <HasPermission entity="webhook" action="delete">
                            <DropdownMenu.Separator />
                            <DropdownMenu.Item
                                className={"text-destructive-primary! [&_svg]:fill-destructive"}
                                onClick={() => {
                                    showDeleteConfirmation(() => presenter.deleteWebhook(row.id));
                                }}
                                icon={<Delete />}
                                text={"Delete"}
                            />
                        </HasPermission>
                    </DropdownMenu>
                ),
                size: 56,
                enableSorting: false,
                enableHiding: false,
                enableResizing: false
            }
        }),
        [presenter]
    );

    if (!vm.list.pagination.loading && vm.list.rows.length === 0) {
        return (
            <div className="flex-1 overflow-hidden">
                <div className="flex flex-col items-center justify-center h-full gap-md">
                    <Text className="text-neutral-strong">No webhooks found.</Text>
                    <CreateWebhookButton />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-hidden">
            <Scrollbar onScrollFrame={scrollFrame => loadMoreOnScroll({ scrollFrame })}>
                <DataTable<Webhook>
                    columns={columns}
                    data={vm.list.rows}
                    loading={vm.list.pagination.loading}
                    sorting={sorting}
                    onSortingChange={onSortingChange}
                    stickyHeader
                />
            </Scrollbar>
        </div>
    );
});
