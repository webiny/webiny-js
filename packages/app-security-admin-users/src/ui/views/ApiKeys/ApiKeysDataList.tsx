import React, { useCallback, useMemo, useState } from "react";
import orderBy from "lodash/orderBy";
import { i18n } from "@webiny/app/i18n";
import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions,
    DataListModalOverlayAction,
    DataListModalOverlay
} from "@webiny/ui/List";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { useRouter } from "@webiny/react-router";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import * as GQL from "./graphql";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import { serializeSorters, deserializeSorters } from "../utils";

const t = i18n.ns("app-security/admin/groups/data-list");

const SORTERS = [
    {
        label: t`Newest to oldest`,
        sorters: { createdOn: "desc" }
    },
    {
        label: t`Oldest to newest`,
        sorters: { createdOn: "asc" }
    },
    {
        label: t`Name A-Z`,
        sorters: { name: "asc" }
    },
    {
        label: t`Name Z-A`,
        sorters: { name: "desc" }
    }
];

const ApiKeysDataList = () => {
    const [filter, setFilter] = useState("");
    const [sort, setSort] = useState(serializeSorters(SORTERS[0].sorters));
    const { history, location } = useRouter();
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog({
        dataTestId: "default-data-list.delete-dialog"
    });

    const filterAPIKey = useCallback(
        ({ description, name }) => {
            return (
                (description && description.toLowerCase().includes(filter)) ||
                name.toLowerCase().includes(filter)
            );
        },
        [filter]
    );

    const sortKeys = useCallback(
        list => {
            if (!sort) {
                return list;
            }
            const [[key, value]] = Object.entries(deserializeSorters(sort));
            return orderBy(list, [key], [value]);
        },
        [sort]
    );

    const { data: listResponse, loading: listLoading } = useQuery(GQL.LIST_API_KEYS);

    const [deleteIt, { loading: deleteLoading }] = useMutation(GQL.DELETE_API_KEY, {
        refetchQueries: [{ query: GQL.LIST_API_KEYS }]
    });

    const data = listLoading && !listResponse ? [] : listResponse.security.apiKeys.data;
    const id = new URLSearchParams(location.search).get("id");

    const deleteItem = useCallback(
        item => {
            showConfirmation(async () => {
                const { data } = await deleteIt({
                    variables: item
                });

                const { error } = data.security.deleteApiKey;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(t`Api key "{id}" deleted.`({ id: item.id }));

                if (id === item.id) {
                    history.push(`/security/api-keys`);
                }
            });
        },
        [id]
    );

    const groupsDataListModalOverlay = useMemo(
        () => (
            <DataListModalOverlay>
                <Grid>
                    <Cell span={12}>
                        <Select value={sort} onChange={setSort} label={t`Sort by`}>
                            {SORTERS.map(({ label, sorters }) => {
                                return (
                                    <option key={label} value={serializeSorters(sorters)}>
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

    const filteredData = filter === "" ? data : data.filter(filterAPIKey);
    const list = sortKeys(filteredData);

    return (
        <DataList
            title={t`Security API keys`}
            actions={
                <ButtonSecondary
                    data-testid="new-record-button"
                    onClick={() => history.push("/security/api-keys?new=true")}
                >
                    <ButtonIcon icon={<AddIcon />} /> {t`New API Key`}
                </ButtonSecondary>
            }
            data={list}
            loading={listLoading || deleteLoading}
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search API keys`}
                />
            }
            modalOverlay={groupsDataListModalOverlay}
            modalOverlayAction={
                <DataListModalOverlayAction
                    icon={<FilterIcon />}
                    data-testid={"default-data-list.filter"}
                />
            }
        >
            {({ data }) => (
                <ScrollList data-testid="default-data-list">
                    {data.map(item => (
                        <ListItem key={item.id} selected={item.id === id}>
                            <ListItemText
                                onClick={() => history.push(`/security/api-keys?id=${item.id}`)}
                            >
                                {item.name}
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

export default ApiKeysDataList;
