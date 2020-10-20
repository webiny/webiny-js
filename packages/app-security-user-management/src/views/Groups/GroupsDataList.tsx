import React, { useCallback } from "react";
import { i18n } from "@webiny/app/i18n";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
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
import { LIST_GROUPS, DELETE_GROUP } from "./graphql";

const t = i18n.ns("app-security/admin/groups/data-list");

const GroupsDataList = () => {
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const listQuery = useQuery(LIST_GROUPS);

    const [deleteIt, deleteMutation] = useMutation(DELETE_GROUP, {
        refetchQueries: [{ query: LIST_GROUPS }]
    });

    const { showConfirmation } = useConfirmationDialog();

    const data = listQuery?.data?.security?.groups?.data || [];
    const id = new URLSearchParams(location.search).get("id");

    const deleteItem = useCallback(
        item => {
            showConfirmation(async () => {
                const response = await deleteIt({
                    variables: item
                });

                const error = response?.data?.security?.deleteGroup?.error;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(t`Group "{slug}" deleted.`({ slug: item.slug }));

                if (id === item.id) {
                    history.push(`/security/groups`);
                }
            });
        },
        [id]
    );

    const loading = [listQuery, deleteMutation].find(item => item.loading);

    return (
        <DataList
            title={t`Security Groups`}
            data={data}
            refresh={listQuery.refetch}
            loading={Boolean(loading)}
        >
            {({ data }) => (
                <ScrollList data-testid="default-data-list">
                    {data.map(item => (
                        <ListItem key={item.id} selected={item.id === id}>
                            <ListItemText
                                onClick={() => history.push(`/security/groups?id=${item.id}`)}
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

export default GroupsDataList;
