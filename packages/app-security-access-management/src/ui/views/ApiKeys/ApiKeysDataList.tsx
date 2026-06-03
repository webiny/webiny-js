import React, { useCallback, useMemo, useState } from "react";
import orderBy from "lodash/orderBy.js";
import { Button, Grid, Select, useToast } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import { List, DataList, DataListModal, DeleteIcon } from "@webiny/admin-ui";

import { useQuery, useMutation } from "@apollo/react-hooks";
import * as GQL from "./graphql.js";
import { deserializeSorters } from "../utils.js";
import type { ApiKey } from "~/types.js";
import { useNamedConfirmationDialog, useRouter, SearchUI } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

const t = i18n.ns("app-security/admin/roles/data-list");

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
export interface ApiKeysDataListProps {
    activeId: string | undefined;
}

export const ApiKeysDataList = ({ activeId }: ApiKeysDataListProps) => {
    const { goToRoute } = useRouter();
    const [filter, setFilter] = useState("");
    const [sort, setSort] = useState<string>(SORTERS[0].sorter);
    const toast = useToast();
    const { showConfirmation } = useNamedConfirmationDialog({
        dataTestId: "default-data-list.delete-dialog"
    });

    const filterAPIKey = useCallback(
        ({ description, name }: ApiKey) => {
            return (
                (description && description.toLowerCase().includes(filter)) ||
                name.toLowerCase().includes(filter)
            );
        },
        [filter]
    );

    const sortKeys = useCallback(
        (list: ApiKey[]) => {
            if (!sort) {
                return list;
            }
            const [key, value] = deserializeSorters(sort);
            return orderBy(list, [key], [value]);
        },
        [sort]
    );

    const { data: listResponse, loading: listLoading } = useQuery<GQL.ListApiKeysResponse>(
        GQL.LIST_API_KEYS
    );

    const [deleteIt, { loading: deleteLoading }] = useMutation(GQL.DELETE_API_KEY, {
        refetchQueries: [{ query: GQL.LIST_API_KEYS }]
    });

    const data = listLoading && !listResponse ? [] : listResponse?.security.apiKeys.data || [];

    const deleteItem = useCallback(
        (item: ApiKey) => {
            showConfirmation(async () => {
                const { data } = await deleteIt({
                    variables: item
                });

                const { error } = data.security.deleteApiKey;
                if (error) {
                    toast.showWarningToast({
                        title: error.message
                    });
                    return;
                }

                toast.showSuccessToast({
                    title: t`Api key "{name}" was deleted.`({ name: item.name })
                });

                if (activeId === item.id) {
                    goToRoute(Routes.ApiKeys.List);
                }
            });
        },
        [activeId]
    );

    const rolesDataListModalOverlay = useMemo(
        () => (
            <DataListModal.Content>
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
            </DataListModal.Content>
        ),
        [sort]
    );

    const filteredData = filter === "" ? data : data.filter(filterAPIKey);
    const list = sortKeys(filteredData);

    return (
        <DataList
            title={t`API keys`}
            actions={
                <Button
                    text={t`New`}
                    icon={<AddIcon />}
                    size={"sm"}
                    className={"ml-xs"}
                    data-testid="new-record-button"
                    onClick={() => {
                        goToRoute(Routes.ApiKeys.List, { new: true });
                    }}
                />
            }
            data={list}
            loading={listLoading || deleteLoading}
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search API keys...`}
                />
            }
            modalOverlay={rolesDataListModalOverlay}
            modalOverlayAction={<DataListModal.Trigger data-testid={"default-data-list.filter"} />}
        >
            {({ data }: { data: ApiKey[] }) => (
                <List data-testid="default-data-list">
                    {data.map(item => (
                        <List.Item
                            key={item.id}
                            selected={item.id === activeId}
                            title={item.name}
                            description={item.description}
                            onClick={() => {
                                goToRoute(Routes.ApiKeys.List, { id: item.id });
                            }}
                            actions={
                                <DeleteIcon
                                    onClick={() => deleteItem(item)}
                                    data-testid={"default-data-list.delete"}
                                />
                            }
                        />
                    ))}
                </List>
            )}
        </DataList>
    );
};
