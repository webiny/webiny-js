import React from "react";
import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { useSnackbar } from "~/index.js";
import { useConfirmationDialog } from "~/index.js";
import { SearchUI } from "~/index.js";
import { useRouter } from "~/index.js";
import { Button } from "@webiny/admin-ui";
import { DataList } from "@webiny/admin-ui";
import { DataListModal } from "@webiny/admin-ui";
import { DeleteIcon } from "@webiny/admin-ui";
import { Grid } from "@webiny/admin-ui";
import { List } from "@webiny/admin-ui";
import { Select } from "@webiny/admin-ui";
import { Tooltip } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { RolesPresenterFeature } from "../feature.js";
import { Routes } from "../../routes.js";
import type { Role } from "~/features/accessManagement/types.js";
import { createReactiveComponent } from "~/presentation/createReactiveComponent.js";
import { toSortOption } from "~/presentation/listPresenter/sortOption.js";
import { fromSortOption } from "~/presentation/listPresenter/sortOption.js";

const SORTERS = [
    { label: "Newest to oldest", sorter: "createdOn_DESC" },
    { label: "Oldest to newest", sorter: "createdOn_ASC" },
    { label: "Name A-Z", sorter: "name_ASC" },
    { label: "Name Z-A", sorter: "name_DESC" }
];

// Why a role can't be deleted, or null when it can.
function lockedReason(item: Role): string | null {
    if (item.system) {
        return "Cannot delete system roles.";
    }
    if (item.plugin) {
        return "Cannot delete roles registered via extensions.";
    }
    return null;
}

export const RolesDataList = createReactiveComponent(
    ({ activeId }: { activeId: string | undefined }) => {
        const { presenter } = useFeature(RolesPresenterFeature);
        const { goToRoute } = useRouter();
        const { showSnackbar } = useSnackbar();
        const { showConfirmation } = useConfirmationDialog({
            dataTestId: "default-data-list.delete-dialog"
        });

        const { list } = presenter;
        const sort = toSortOption(list.vm.sort);
        const setSort = (value: string) => {
            const option = fromSortOption(value);
            list.actions.sort.set(option.field, option.direction);
        };

        const deleteItem = useCallback(
            (item: Role) => {
                showConfirmation(async () => {
                    try {
                        await presenter.deleteRole(item.id);
                        showSnackbar(`Role "${item.slug}" deleted.`);
                        if (activeId === item.id) {
                            goToRoute(Routes.Roles.List);
                        }
                    } catch (e: any) {
                        showSnackbar(e.message);
                    }
                });
            },
            [activeId]
        );

        return (
            <DataList
                title={"Roles"}
                refresh={null}
                actions={
                    <Button
                        text={"New"}
                        icon={<AddIcon />}
                        size={"sm"}
                        className={"ml-xs"}
                        data-testid="new-record-button"
                        onClick={() => goToRoute(Routes.Roles.List, { new: true })}
                    />
                }
                data={list.vm.rows}
                loading={list.vm.pagination.loading}
                search={
                    <SearchUI
                        value={list.vm.search}
                        onChange={list.actions.search.set}
                        inputPlaceholder={"Search roles..."}
                    />
                }
                modalOverlay={
                    <DataListModal.Content>
                        <Grid>
                            <Grid.Column span={12}>
                                <Select
                                    value={sort}
                                    onChange={setSort}
                                    label={"Sort by"}
                                    options={SORTERS.map(({ label, sorter: value }) => ({
                                        label,
                                        value
                                    }))}
                                />
                            </Grid.Column>
                        </Grid>
                    </DataListModal.Content>
                }
                modalOverlayAction={
                    <DataListModal.Trigger data-testid={"default-data-list.filter"} />
                }
            >
                {({ data }: { data: Role[] }) => (
                    <List data-testid="default-data-list">
                        {data.map(item => {
                            const locked = lockedReason(item);
                            let actions = (
                                <DeleteIcon
                                    onClick={() => deleteItem(item)}
                                    data-testid={"default-data-list.delete"}
                                />
                            );
                            if (locked) {
                                actions = (
                                    <Tooltip content={locked} trigger={<DeleteIcon disabled />} />
                                );
                            }

                            return (
                                <List.Item
                                    key={item.id}
                                    selected={item.id === activeId}
                                    title={item.name}
                                    description={item.description}
                                    onClick={() => goToRoute(Routes.Roles.List, { id: item.id })}
                                    actions={actions}
                                />
                            );
                        })}
                    </List>
                )}
            </DataList>
        );
    }
);
