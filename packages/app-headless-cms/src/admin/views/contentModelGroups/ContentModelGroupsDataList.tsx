import React, { useCallback, useMemo, useState } from "react";
import get from "lodash/get.js";
import orderBy from "lodash/orderBy.js";
import dotProp from "dot-prop-immutable";
import { i18n } from "@webiny/app/i18n/index.js";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { DeleteIcon } from "@webiny/ui/List/DataList/icons/index.js";
import {
    DataList,
    DataListModalOverlay,
    DataListModalOverlayAction,
    List,
    ListActions,
    ListItem,
    ListItemMeta,
    ListItemText,
    ListItemTextPrimary,
    ListItemTextSecondary
} from "@webiny/ui/List/index.js";
import { useSnackbar, useRouter, useConfirmationDialog, SearchUI } from "@webiny/app-admin";
import { Button, Select, Tooltip } from "@webiny/admin-ui";
import { useApolloClient, useQuery } from "../../hooks/index.js";
import * as GQL from "./graphql.js";
import type { CmsGroupWithModels, ListCmsGroupsQueryResponse } from "./graphql.js";
import { deserializeSorters } from "../utils.js";
import { usePermission } from "~/admin/hooks/index.js";
import type { CmsGroup } from "~/types.js";
import { Routes } from "~/routes.js";

const t = i18n.ns("app-headless-cms/admin/content-model-groups/data-list");

interface Sort {
    label: string;
    sorters: string;
}
const SORTERS: Sort[] = [
    {
        label: t`Newest to oldest`,
        sorters: "createdOn_DESC"
    },
    {
        label: t`Oldest to newest`,
        sorters: "createdOn_ASC"
    },
    {
        label: t`Name A-Z`,
        sorters: "name_ASC"
    },
    {
        label: t`Name Z-A`,
        sorters: "name_DESC"
    }
];

interface ContentModelGroupsDataListProps {
    canCreate: boolean;
}
const ContentModelGroupsDataList = ({ canCreate }: ContentModelGroupsDataListProps) => {
    const [filter, setFilter] = useState<string>("");
    const [sort, setSort] = useState<string>(SORTERS[0].sorters);
    const { goToRoute } = useRouter();
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();
    const listQuery = useQuery(GQL.LIST_CONTENT_MODEL_GROUPS);

    const { showConfirmation } = useConfirmationDialog({
        dataTestId: "cms.contentModelGroup.list-item.delete-dialog"
    });
    const { canDelete } = usePermission();

    const filterData = useCallback(
        ({ name }: Pick<CmsGroup, "name">) => {
            return name.toLowerCase().includes(filter);
        },
        [filter]
    );

    const sortData = useCallback(
        (list: CmsGroupWithModels[]): CmsGroupWithModels[] => {
            if (!sort) {
                return list;
            }
            const [sortField, sortOrderBy] = deserializeSorters(sort);
            return orderBy(list, [sortField], [sortOrderBy]);
        },
        [sort]
    );

    const data: CmsGroupWithModels[] = listQuery.loading
        ? []
        : get(listQuery, "data.listContentModelGroups.data", []);
    const groupId = new URLSearchParams(location.search).get("id");

    const deleteItem = useCallback(
        (group: Pick<CmsGroup, "id" | "name">) => {
            showConfirmation(async () => {
                const response = await client.mutate({
                    mutation: GQL.DELETE_CONTENT_MODEL_GROUP,
                    variables: { id: group.id },
                    update(cache, { data }) {
                        const { error } = data.deleteContentModelGroup;
                        if (error) {
                            showSnackbar(error.message);
                            return;
                        }

                        // Delete the item from list cache
                        const gqlParams = { query: GQL.LIST_CONTENT_MODEL_GROUPS };
                        const result = cache.readQuery<ListCmsGroupsQueryResponse>(gqlParams);
                        if (!result || !result.listContentModelGroups) {
                            return;
                        }
                        const { listContentModelGroups } = result;
                        const index = listContentModelGroups.data.findIndex(
                            item => item.id === group.id
                        );

                        cache.writeQuery({
                            ...gqlParams,
                            data: {
                                listContentModelGroups: dotProp.delete(
                                    listContentModelGroups,
                                    `data.${index}`
                                )
                            }
                        });
                    }
                });

                const { error } = response.data.deleteContentModelGroup;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(t`Content model group "{name}" deleted.`({ name: group.name }));

                if (groupId === group.id) {
                    goToRoute(Routes.ContentModelGroups.List);
                }
            });
        },
        [groupId]
    );

    const contentModelGroupsDataListModalOverlay = useMemo(
        () => (
            <DataListModalOverlay>
                <Select
                    value={sort}
                    onChange={setSort}
                    label={t`Sort by`}
                    description={"Sort groups by"}
                    options={SORTERS.map(sorter => ({
                        label: sorter.label,
                        value: sorter.sorters
                    }))}
                />
            </DataListModalOverlay>
        ),
        [sort]
    );

    const filteredData = filter === "" ? data : data.filter(filterData);
    const contentModelGroups = sortData(filteredData);

    const onRefreshClick = useCallback(() => {
        listQuery.refetch();
    }, []);

    return (
        <DataList
            loading={listQuery.loading}
            data={contentModelGroups}
            title={t`Content model groups`}
            actions={
                canCreate ? (
                    <Button
                        data-testid="new-group-button"
                        onClick={() => {
                            goToRoute(Routes.ContentModelGroups.List, { new: true });
                        }}
                        text={t`New`}
                        icon={<AddIcon />}
                        size={"sm"}
                        className={"ml-xs"}
                    />
                ) : null
            }
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search content model group...`}
                />
            }
            modalOverlay={contentModelGroupsDataListModalOverlay}
            modalOverlayAction={
                <DataListModalOverlayAction data-testid={"default-data-list.filter"} />
            }
            refresh={onRefreshClick}
        >
            {({ data }: { data: CmsGroupWithModels[] }) => (
                <List data-testid="default-data-list">
                    {data.map(item => (
                        <ListItem key={item.id} selected={item.id === groupId}>
                            <ListItemText
                                onClick={() => {
                                    goToRoute(Routes.ContentModelGroups.List, { id: item.id });
                                }}
                            >
                                <ListItemTextPrimary>{item.name}</ListItemTextPrimary>
                                <ListItemTextSecondary>
                                    {item.contentModels.length
                                        ? t`{contentModels|count:1:content model:default:content models}`(
                                              {
                                                  contentModels: item.contentModels.length
                                              }
                                          )
                                        : t`No content models`}
                                </ListItemTextSecondary>
                            </ListItemText>
                            {canDelete(item, "cms.contentModelGroup") && (
                                <ListItemMeta>
                                    <ListActions>
                                        {item.plugin ? (
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
                                        )}
                                    </ListActions>
                                </ListItemMeta>
                            )}
                        </ListItem>
                    ))}
                </List>
            )}
        </DataList>
    );
};

export default ContentModelGroupsDataList;
