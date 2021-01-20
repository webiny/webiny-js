import React, { useCallback, useState } from "react";
import orderBy from "lodash/orderBy";
import { i18n } from "@webiny/app/i18n";
import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions
} from "@webiny/ui/List";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { useRouter } from "@webiny/react-router";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useQuery, useMutation } from "react-apollo";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import * as GQL from "./graphql";
import { ReactComponent as AddIcon } from "../../assets/icons/add-18px.svg";

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
    const [sort, setSort] = useState(null);
    const { history, location } = useRouter();
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog();

    const filterAPIKey = useCallback(
        ({ description, name }) => {
            return (
                description.toLowerCase().includes(filter) || name.toLowerCase().includes(filter)
            );
        },
        [filter]
    );

    const sortKeys = useCallback(
        list => {
            if (!sort) {
                return list;
            }
            const [[key, value]] = Object.entries(sort);
            return orderBy(list, [key], [value]);
        },
        [sort]
    );

    const { data: listResponse, loading: listLoading, refetch } = useQuery(GQL.LIST_API_KEYS);

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
                    <ButtonIcon icon={<AddIcon />} /> {t`Add API Key`}
                </ButtonSecondary>
            }
            data={list}
            refresh={refetch}
            loading={listLoading || deleteLoading}
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search API keys`}
                />
            }
            sorters={SORTERS}
            setSorters={sorter => setSort(sorter)}
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
                                    <DeleteIcon onClick={() => deleteItem(item)} />
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
