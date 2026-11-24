import React from "react";
import { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { i18n } from "@webiny/app/i18n/index.js";
import { useSnackbar, useConfirmationDialog, SearchUI, useRouter } from "@webiny/app-admin";
import {
    Button,
    DataList,
    DataListModal,
    DeleteIcon,
    List,
    Select,
    Tooltip
} from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ModelGroupPresenterFeature } from "~/presentation/modelGroup/feature.js";
import { usePermission } from "~/admin/hooks/index.js";
import { Routes } from "~/routes.js";
import type { ModelGroupDto } from "~/features/modelGroup/listModelGroups/abstractions.js";
import { toSortOption } from "@webiny/app-admin/presentation/listPresenter/sortOption.js";
import { fromSortOption } from "@webiny/app-admin/presentation/listPresenter/sortOption.js";

const t = i18n.ns("app-headless-cms/admin/content-model-groups/data-list");

const SORTERS = [
    { label: "Newest to oldest", sorter: "createdOn_DESC" },
    { label: "Oldest to newest", sorter: "createdOn_ASC" },
    { label: "Name A-Z", sorter: "name_ASC" },
    { label: "Name Z-A", sorter: "name_DESC" }
];

export const ContentModelGroupsDataList = observer(
    ({ activeId }: { activeId: string | undefined }) => {
        const { presenter } = useFeature(ModelGroupPresenterFeature);
        const { goToRoute } = useRouter();
        const { showSnackbar } = useSnackbar();
        const { showConfirmation } = useConfirmationDialog({
            dataTestId: "cms.contentModelGroup.list-item.delete-dialog"
        });
        const { canCreate, canDelete } = usePermission();

        const { list } = presenter;
        const sort = toSortOption(list.vm.sort);
        const setSort = (value: string) => {
            const option = fromSortOption(value);
            list.actions.sort.set(option.field, option.direction);
        };

        const deleteItem = useCallback(
            (item: ModelGroupDto) => {
                showConfirmation(async () => {
                    try {
                        await presenter.deleteGroup(item.id);
                        showSnackbar(t`Content model group "{name}" deleted.`({ name: item.name }));
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
                            onClick={() => goToRoute(Routes.ContentModelGroups.List, { new: true })}
                            text={t`New`}
                            icon={<AddIcon />}
                            size={"sm"}
                            className={"ml-xs"}
                        />
                    ) : null
                }
                data={list.vm.rows}
                loading={list.vm.pagination.loading}
                search={
                    <SearchUI
                        value={list.vm.search}
                        onChange={list.actions.search.set}
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
