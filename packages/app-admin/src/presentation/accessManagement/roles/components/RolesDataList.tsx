import React from "react";
import { useCallback } from "react";
import { useMemo } from "react";
import { useState } from "react";
import orderBy from "lodash/orderBy.js";
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

const SORTERS = [
    { label: "Newest to oldest", sorter: "createdOn_DESC" },
    { label: "Oldest to newest", sorter: "createdOn_ASC" },
    { label: "Name A-Z", sorter: "name_ASC" },
    { label: "Name Z-A", sorter: "name_DESC" }
];

const deserializeSorters = (data: string): [string, "asc" | "desc"] => {
    const [field, order] = data.split("_");
    return [field, order.toLowerCase() === "asc" ? "asc" : "desc"];
};

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

        const [filter, setFilter] = useState("");
        const [sort, setSort] = useState(SORTERS[0].sorter);

        const roles = presenter.list.vm.rows;
        const loading = presenter.list.vm.pagination.loading;

        const filteredData = useMemo(() => {
            if (filter === "") {
                return roles;
            }
            const lc = filter.toLowerCase();
            return roles.filter(
                (r: Role) =>
                    r.name.toLowerCase().includes(lc) ||
                    r.slug.toLowerCase().includes(lc) ||
                    (r.description && r.description.toLowerCase().includes(lc))
            );
        }, [roles, filter]);

        const sortedData = useMemo(() => {
            if (!sort) {
                return filteredData;
            }
            const [key, order] = deserializeSorters(sort);
            return orderBy(filteredData, [key], [order]);
        }, [filteredData, sort]);

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
                data={sortedData}
                loading={loading}
                search={
                    <SearchUI
                        value={filter}
                        onChange={setFilter}
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
