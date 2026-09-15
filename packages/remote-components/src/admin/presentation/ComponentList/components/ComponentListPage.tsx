import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { useRouter } from "@webiny/app-admin";
import { DialogsProvider } from "@webiny/app-admin/components/index.js";
import {
    Button,
    DataTable,
    DropdownMenu,
    Heading,
    IconButton,
    Scrollbar,
    Separator,
    Tag,
    Text,
    TimeAgo
} from "@webiny/admin-ui";
import { useToast } from "@webiny/admin-ui";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/index.js";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ComponentListFeature } from "../feature.js";
import { RemoteComponentGatewayFeature } from "~/admin/features/shared/feature.js";
import { useCreateComponentDialog } from "~/admin/presentation/CreateComponent/components/CreateComponentDialog.js";
import { Routes } from "~/admin/routes.js";
import type { RemoteComponentDto } from "~/shared/types.js";

const ComponentListContent = observer(function ComponentListContent() {
    const { presenter } = useFeature(ComponentListFeature);
    const { goToRoute } = useRouter();
    const { openDialog: openCreateDialog } = useCreateComponentDialog();
    const toast = useToast();

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    const { showConfirmation: showDeleteConfirmation } = useConfirmationDialog({
        title: "Delete Component",
        message: "Are you sure you want to delete this component?"
    });

    const { vm } = presenter;

    const columns = useMemo(
        () => ({
            name: {
                header: "Name",
                cell: (row: RemoteComponentDto) => (
                    <Text
                        className="cursor-pointer text-primary hover:underline"
                        onClick={() => goToRoute(Routes.Editor, { id: row.id })}
                    >
                        {row.name}
                    </Text>
                ),
                size: 200
            },
            label: {
                header: "Label",
                cell: (row: RemoteComponentDto) => <Text>{row.label}</Text>,
                size: 200
            },
            status: {
                header: "Status",
                cell: (row: RemoteComponentDto) => (
                    <Tag
                        variant={row.status === "published" ? "success" : "neutral-muted"}
                        content={row.status}
                    />
                ),
                size: 100
            },
            savedOn: {
                header: "Last Modified",
                cell: (row: RemoteComponentDto) =>
                    row.savedOn ? <TimeAgo datetime={row.savedOn} /> : <Text size="sm">—</Text>,
                size: 150
            },
            actions: {
                header: " ",
                cell: (row: RemoteComponentDto) => (
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
                            icon={<EditIcon />}
                            onClick={() => goToRoute(Routes.Editor, { id: row.id })}
                            text="Edit"
                        />
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item
                            variant="destructive"
                            icon={<DeleteIcon />}
                            onClick={() => {
                                showDeleteConfirmation(async () => {
                                    await presenter.deleteComponent(row.id);
                                    toast.showSuccessToast({ title: "Component deleted." });
                                });
                            }}
                            text="Delete"
                        />
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

    if (!vm.loading && vm.components.length === 0) {
        return (
            <div className="flex-1 overflow-hidden">
                <div className="flex flex-col items-center justify-center h-full gap-md">
                    <Text className="text-neutral-strong">No remote components yet.</Text>
                    <Button
                        variant="primary"
                        onClick={() => openCreateDialog()}
                        icon={<AddIcon />}
                        text="New Component"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-hidden">
            <Scrollbar>
                <DataTable<RemoteComponentDto>
                    columns={columns}
                    data={vm.components}
                    loading={vm.loading}
                    stickyHeader
                />
            </Scrollbar>
        </div>
    );
});

const ComponentListHeader = () => {
    const { openDialog: openCreateDialog } = useCreateComponentDialog();

    return (
        <div className="flex items-center justify-between py-sm px-md">
            <Heading level={5}>Remote Components</Heading>
            <Button
                variant="primary"
                onClick={() => openCreateDialog()}
                icon={<AddIcon />}
                text="New Component"
            />
        </div>
    );
};

export const ComponentListPage = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        RemoteComponentGatewayFeature.register(child);
        ComponentListFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <DialogsProvider>
                <div className="flex flex-col h-main-content">
                    <ComponentListHeader />
                    <Separator />
                    <ComponentListContent />
                </div>
            </DialogsProvider>
        </DiContainerProvider>
    );
};
