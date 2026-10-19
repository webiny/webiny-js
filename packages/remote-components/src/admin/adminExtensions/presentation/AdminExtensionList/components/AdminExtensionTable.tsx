import React from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/index.js";
import { Alert } from "@webiny/admin-ui";
import { DataTable } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Scrollbar } from "@webiny/admin-ui";
import { Switch } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { TimeAgo } from "@webiny/admin-ui";
import { useToast } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { AdminExtensionListFeature } from "../feature.js";
import type { AdminExtensionListPresenter } from "../abstractions.js";

type Row = AdminExtensionListPresenter.Row;

const EmptyState = () => (
    <div className="flex h-full flex-col items-center justify-center gap-sm p-lg text-center">
        <Text className="text-neutral-strong">No admin extensions yet.</Text>
        <Text size="sm" className="text-neutral-muted">
            Ask the assistant to add a menu item, and it shows up here.
        </Text>
    </div>
);

export const AdminExtensionTable = createReactiveComponent(function AdminExtensionTable() {
    const { presenter } = useFeature(AdminExtensionListFeature);
    const toast = useToast();
    const { showConfirmation } = useConfirmationDialog({
        title: "Delete admin extension",
        message: "This removes it for everyone. Disable it instead if you may want it back."
    });

    useEffect(() => {
        void presenter.load();
    }, [presenter]);

    const columns = useMemo(
        () => ({
            label: {
                header: "Extension",
                cell: (row: Row) => (
                    <div className="flex flex-col">
                        <Text>{row.label}</Text>
                        <Text size="sm" className="text-neutral-muted">
                            {row.description || row.name}
                        </Text>
                    </div>
                ),
                size: 320
            },
            kind: {
                header: "Kind",
                cell: (row: Row) => <Tag variant="neutral-muted" content={row.kindLabel} />,
                size: 140
            },
            enabled: {
                header: "Enabled",
                cell: (row: Row) => (
                    <Switch
                        checked={row.enabled}
                        disabled={row.busy}
                        label={row.enabled ? "On" : "Off"}
                        labelPosition="end"
                        onChange={(enabled: boolean) => void presenter.setEnabled(row.id, enabled)}
                    />
                ),
                size: 100,
                enableSorting: false
            },
            savedOn: {
                header: "Last modified",
                cell: (row: Row) => <TimeAgo datetime={row.savedOn} />,
                size: 150
            },
            actions: {
                header: " ",
                cell: (row: Row) => (
                    <IconButton
                        icon={<DeleteIcon />}
                        variant="ghost"
                        size="sm"
                        disabled={row.busy}
                        aria-label={`Delete ${row.label}`}
                        onClick={() => {
                            showConfirmation(async () => {
                                const deleted = await presenter.delete(row.id);
                                if (deleted) {
                                    toast.showSuccessToast({ title: `Deleted ${row.label}.` });
                                }
                            });
                        }}
                    />
                ),
                size: 56,
                enableSorting: false,
                enableHiding: false,
                enableResizing: false
            }
        }),
        [presenter]
    );

    const { vm } = presenter;

    let content = <EmptyState />;
    if (vm.loading || vm.rows.length > 0) {
        content = (
            <Scrollbar>
                <DataTable<Row>
                    columns={columns}
                    data={vm.rows}
                    loading={vm.loading}
                    stickyHeader
                />
            </Scrollbar>
        );
    }

    return (
        <div className="flex-1 overflow-hidden">
            {vm.error ? <Alert type="danger" title={vm.error} /> : null}
            {content}
        </div>
    );
});
