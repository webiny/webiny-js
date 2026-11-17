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
import { TeamsPresenterFeature } from "../feature.js";
import { Routes } from "../../routes.js";
import type { Team } from "~/features/accessManagement/types.js";
import { createReactiveComponent } from "~/presentation/createReactiveComponent.js";

const SORTERS = [
    { label: "Newest to oldest", sorter: "createdOn_DESC" },
    { label: "Oldest to newest", sorter: "createdOn_ASC" },
    { label: "Name A-Z", sorter: "name_ASC" },
    { label: "Name Z-A", sorter: "name_DESC" }
];

// Why a team can't be deleted, or null when it can.
function lockedReason(item: Team): string | null {
    if (item.system) {
        return "Cannot delete system teams.";
    }
    if (item.plugin) {
        return "Cannot delete teams registered via extensions.";
    }
    return null;
}

export const TeamsDataList = createReactiveComponent(
    ({ activeId }: { activeId: string | undefined }) => {
        const { presenter } = useFeature(TeamsPresenterFeature);
        const { goToRoute } = useRouter();
        const { showSnackbar } = useSnackbar();
        const { showConfirmation } = useConfirmationDialog({
            dataTestId: "default-data-list.delete-dialog"
        });

        const { list } = presenter;
        const sort = list.vm.sort ? `${list.vm.sort.field}_${list.vm.sort.direction}` : "";
        const setSort = (value: string) => {
            const [field, direction] = value.split("_");
            list.actions.sort.set(field, direction === "ASC" ? "ASC" : "DESC");
        };

        const deleteItem = useCallback(
            (item: Team) => {
                showConfirmation(async () => {
                    try {
                        await presenter.deleteTeam(item.id);
                        showSnackbar(`Team "${item.slug}" deleted.`);
                        if (activeId === item.id) {
                            goToRoute(Routes.Teams.List);
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
                title={"Teams"}
                refresh={null}
                actions={
                    <Button
                        text={"New"}
                        icon={<AddIcon />}
                        size={"sm"}
                        className={"ml-xs"}
                        data-testid="new-record-button"
                        onClick={() => goToRoute(Routes.Teams.List, { new: true })}
                    />
                }
                data={list.vm.rows}
                loading={list.vm.pagination.loading}
                search={
                    <SearchUI
                        value={list.vm.search}
                        onChange={list.actions.search.set}
                        inputPlaceholder={"Search teams..."}
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
                {({ data }: { data: Team[] }) => (
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
                                    onClick={() => goToRoute(Routes.Teams.List, { id: item.id })}
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
