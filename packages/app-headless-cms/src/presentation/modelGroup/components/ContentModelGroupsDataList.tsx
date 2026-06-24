import React, { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import orderBy from "lodash/orderBy.js";
import { useFeature } from "@webiny/app";
import { i18n } from "@webiny/app/i18n/index.js";
import { useSnackbar, useConfirmationDialog, SearchUI, useRouter } from "@webiny/app-admin";
import { Button, DataList, DataListModal, DeleteIcon, List, Select, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ModelGroupPresenterFeature } from "~/presentation/modelGroup/feature.js";
import { usePermission } from "~/admin/hooks/index.js";
import { Routes } from "~/routes.js";
import type { ModelGroupDto } from "~/features/modelGroup/listModelGroups/abstractions.js";

const t = i18n.ns("app-headless-cms/admin/content-model-groups/data-list");

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

export const ContentModelGroupsDataList = observer(
    ({ activeId }: { activeId: string | undefined }) => {
        const { presenter } = useFeature(ModelGroupPresenterFeature);
        const { goToRoute } = useRouter();
        const { showSnackbar } = useSnackbar();
        const { showConfirmation } = useConfirmationDialog({
            dataTestId: "cms.contentModelGroup.list-item.delete-dialog"
        });
        const { canCreate, canDelete } = usePermission();

        const [filter, setFilter] = useState("");
        const [sort, setSort] = useState(SORTERS[0].sorter);

        const groups = presenter.list.vm.rows;
        const loading = presenter.list.vm.pagination.loading;

        const filteredData = useMemo(() => {
            if (filter === "") {
                return groups;
            }
            const lc = filter.toLowerCase();
            return groups.filter((g: ModelGroupDto) => g.name.toLowerCase().includes(lc));
        }, [groups, filter]);

        const sortedData = useMemo(() => {
            if (!sort) {
                return filteredData;
            }
            const [key, order] = deserializeSorters(sort);
            return orderBy(filteredData, [key], [order]);
        }, [filteredData, sort]);

        const deleteItem = useCallback(
            (item: ModelGroupDto) => {
                showConfirmation(async () => {
                    try {
                        await presenter.deleteGroup(item.id);
                        showSnackbar(
                            t`Content model group "{name}" deleted.`({ name: item.name })
                        );
                        if (activeId === item.id) {
                            goToRoute(Routes.ContentModelGroups.List);
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
                title={t`Content model groups`}
                refresh={null}
                actions={
                    canCreate("cms.contentModelGroup") ? (
                        <Button
                            data-testid="new-group-button"
                            onClick={() =>
                                goToRoute(Routes.ContentModelGroups.List, { new: true })
                            }
                            text={t`New`}
                            icon={<AddIcon />}
                            size={"sm"}
                            className={"ml-xs"}
                        />
                    ) : null
                }
                data={sortedData}
                loading={loading}
                search={
                    <SearchUI
                        value={filter}
                        onChange={setFilter}
                        inputPlaceholder={t`Search content model group...`}
                    />
                }
                modalOverlay={
                    <DataListModal.Content>
                        <Select
                            value={sort}
                            onChange={setSort}
                            label={t`Sort by`}
                            description={"Sort groups by"}
                            options={SORTERS.map(({ label, sorter: value }) => ({
                                label,
                                value
                            }))}
                        />
                    </DataListModal.Content>
                }
                modalOverlayAction={
                    <DataListModal.Trigger data-testid={"default-data-list.filter"} />
                }
            >
                {({ data }: { data: ModelGroupDto[] }) => (
                    <List data-testid="default-data-list">
                        {data.map(item => (
                            <List.Item
                                key={item.id}
                                selected={item.id === activeId}
                                title={item.name}
                                description={
                                    item.contentModels.length
                                        ? t`{contentModels|count:1:content model:default:content models}`(
                                              {
                                                  contentModels: item.contentModels.length
                                              }
                                          )
                                        : t`No content models`
                                }
                                onClick={() =>
                                    goToRoute(Routes.ContentModelGroups.List, { id: item.id })
                                }
                                actions={
                                    canDelete(item, "cms.contentModelGroup") ? (
                                        item.plugin ? (
                                            <Tooltip
                                                content={
                                                    "Content model group is registered via a plugin."
                                                }
                                                side={"bottom"}
                                                trigger={
                                                    <DeleteIcon
                                                        disabled
                                                        data-testid={
                                                            "cms.contentModelGroup.list-item.delete"
                                                        }
                                                    />
                                                }
                                            />
                                        ) : (
                                            <DeleteIcon
                                                onClick={() => deleteItem(item)}
                                                data-testid={
                                                    "cms.contentModelGroup.list-item.delete"
                                                }
                                            />
                                        )
                                    ) : undefined
                                }
                            />
                        ))}
                    </List>
                )}
            </DataList>
        );
    }
);
