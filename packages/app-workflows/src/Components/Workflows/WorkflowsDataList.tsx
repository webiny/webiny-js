import React, { useCallback, useMemo, useState } from "react";
import orderBy from "lodash/orderBy.js";
import { Button, Grid, Select } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions,
    DataListModalOverlayAction,
    DataListModalOverlay,
    ListItemTextPrimary
} from "@webiny/ui/List/index.js";
import { DeleteIcon } from "@webiny/ui/List/DataList/icons/index.js";
import { useQuery, useMutation } from "@apollo/react-hooks";
import * as GQL from "./graphql.js";
import { deserializeSorters } from "../utils.js";
import type { Workflow } from "~/types.js";
import { useSnackbar, useConfirmationDialog, useRouter, SearchUI } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

const t = i18n.ns("app-security/admin/groups/data-list");

const SORTERS = [
    {
        label: t`Newest to oldest`,
        sorter: "createdOn_DESC"
    },
    {
        label: t`Oldest to newest`,
        sorter: "createdOn_ASC"
    },
    {
        label: t`Name A-Z`,
        sorter: "name_ASC"
    },
    {
        label: t`Name Z-A`,
        sorter: "name_DESC"
    }
];
export interface WorkflowsDataListProps {
    activeId: string | undefined;
}

export const WorkflowsDataList = ({ activeId }: WorkflowsDataListProps) => {
    const { goToRoute } = useRouter();
    const [filter, setFilter] = useState("");
    const [sort, setSort] = useState<string>(SORTERS[0].sorter);
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog({
        dataTestId: "default-data-list.delete-dialog"
    });

    const filterWorkflow = useCallback(
        ({ description, name }: Workflow) => {
            return (
                (description && description.toLowerCase().includes(filter)) ||
                name.toLowerCase().includes(filter)
            );
        },
        [filter]
    );

    const sortKeys = useCallback(
        (list: Workflow[]) => {
            if (!sort) {
                return list;
            }
            const [key, value] = deserializeSorters(sort);
            return orderBy(list, [key], [value]);
        },
        [sort]
    );

    const { data: listResponse, loading: listLoading } = useQuery<GQL.ListWorkflowsResponse>(
        GQL.LIST_API_KEYS
    );

    const [deleteIt, { loading: deleteLoading }] = useMutation(GQL.DELETE_API_KEY, {
        refetchQueries: [{ query: GQL.LIST_API_KEYS }]
    });

    const data = listLoading && !listResponse ? [] : listResponse?.security.workflows.data || [];

    const deleteItem = useCallback(
        (item: Workflow) => {
            showConfirmation(async () => {
                const { data } = await deleteIt({
                    variables: item
                });

                const { error } = data.security.deleteWorkflow;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(t`Workflow "{id}" deleted.`({ id: item.id }));

                if (activeId === item.id) {
                    goToRoute(Routes.Workflows.List);
                }
            });
        },
        [activeId]
    );

    const groupsDataListModalOverlay = useMemo(
        () => (
            <DataListModalOverlay>
                <Grid>
                    <Grid.Column span={12}>
                        <Select
                            value={sort}
                            onChange={setSort}
                            label={t`Sort by`}
                            options={SORTERS.map(({ label, sorter: value }) => {
                                return {
                                    label,
                                    value
                                };
                            })}
                        />
                    </Grid.Column>
                </Grid>
            </DataListModalOverlay>
        ),
        [sort]
    );

    const filteredData = filter === "" ? data : data.filter(filterWorkflow);
    const list = sortKeys(filteredData);

    return (
        <DataList
            title={t`Workflows`}
            actions={
                <Button
                    text={t`New`}
                    icon={<AddIcon />}
                    size={"sm"}
                    className={"ml-xs"}
                    data-testid="new-record-button"
                    onClick={() => {
                        goToRoute(Routes.Workflows.List, { new: true });
                    }}
                />
            }
            data={list}
            loading={listLoading || deleteLoading}
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search workflows...`}
                />
            }
            modalOverlay={groupsDataListModalOverlay}
            modalOverlayAction={
                <DataListModalOverlayAction data-testid={"default-data-list.filter"} />
            }
        >
            {({ data }: { data: Workflow[] }) => (
                <ScrollList data-testid="default-data-list">
                    {data.map(item => (
                        <ListItem key={item.id} selected={item.id === activeId}>
                            <ListItemText
                                onClick={() => {
                                    goToRoute(Routes.Workflows.List, { id: item.id });
                                }}
                            >
                                <ListItemTextPrimary>{item.name}</ListItemTextPrimary>
                                <ListItemTextSecondary>{item.description}</ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    <DeleteIcon
                                        onClick={() => deleteItem(item)}
                                        data-testid={"default-data-list.delete"}
                                    />
                                </ListActions>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </ScrollList>
            )}
        </DataList>
    );
};
