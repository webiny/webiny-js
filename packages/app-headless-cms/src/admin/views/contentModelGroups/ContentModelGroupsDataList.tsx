import React, { useCallback, useMemo, useState } from "react";
import get from "lodash/get";
import orderBy from "lodash/orderBy";
import dotProp from "dot-prop-immutable";
import { i18n } from "@webiny/app/i18n";
import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import {
    DataList,
    DataListModalOverlay,
    DataListModalOverlayAction,
    List,
    ListActions,
    ListItem,
    ListItemMeta,
    ListItemText,
    ListItemTextSecondary
} from "@webiny/ui/List";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useApolloClient, useQuery } from "../../hooks";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import * as GQL from "./graphql";
import { CmsGroupWithModels, ListCmsGroupsQueryResponse } from "./graphql";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import { deserializeSorters } from "../utils";
import usePermission from "../../hooks/usePermission";
import { Tooltip } from "@webiny/ui/Tooltip";
import { CmsGroup } from "~/types";

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
    const { history } = useRouter();
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
                    history.push(`/cms/content-model-groups`);
                }
            });
        },
        [groupId]
    );

    const contentModelGroupsDataListModalOverlay = useMemo(
        () => (
            <DataListModalOverlay>
                <Grid>
                    <Cell span={12}>
                        <Select
                            value={sort}
                            onChange={setSort}
                            label={t`Sort by`}
                            description={"Sort groups by"}
                        >
                            {SORTERS.map(({ label, sorters }) => {
                                return (
                                    <option key={label} value={sorters}>
                                        {label}
                                    </option>
                                );
                            })}
                        </Select>
                    </Cell>
                </Grid>
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
            title={t`Content Model Groups`}
            actions={
                canCreate ? (
                    <ButtonSecondary
                        data-testid="new-record-button"
                        onClick={() => history.push("/cms/content-model-groups?new=true")}
                    >
                        <ButtonIcon icon={<AddIcon />} /> {t`New Group`}
                    </ButtonSecondary>
                ) : null
            }
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search content model group`}
                />
            }
            modalOverlay={contentModelGroupsDataListModalOverlay}
            modalOverlayAction={
                <DataListModalOverlayAction
                    icon={<FilterIcon />}
                    data-testid={"default-data-list.filter"}
                />
            }
            refresh={onRefreshClick}
        >
            {({ data }: { data: CmsGroupWithModels[] }) => (
                <List data-testid="default-data-list">
                    {data.map(item => (
                        <ListItem key={item.id} selected={item.id === groupId}>
                            <ListItemText
                                onClick={() =>
                                    history.push(`/cms/content-model-groups?id=${item.id}`)
                                }
                            >
                                {item.name}
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
                                                placement={"bottom"}
                                            >
                                                <DeleteIcon
                                                    disabled
                                                    data-testid={
                                                        "cms.contentModelGroup.list-item.delete"
                                                    }
                                                />
                                            </Tooltip>
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
