import React, { useCallback } from "react";
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
import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useQuery, useMutation } from "react-apollo";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import * as GQL from "./graphql";

const t = i18n.ns("app-security/admin/groups/data-list");

const ApiKeysDataList = () => {
    const { history, location } = useRouter();
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog();

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

    return (
        <DataList
            title={t`Security API keys`}
            data={data}
            refresh={refetch}
            loading={listLoading || deleteLoading}
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
