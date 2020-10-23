import React, { useCallback } from "react";
import { i18n } from "@webiny/app/i18n";
import { useSecurity } from "@webiny/app-security";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Image } from "@webiny/app/components";

import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions,
    ListItemGraphic
} from "@webiny/ui/List";

import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { Avatar } from "@webiny/ui/Avatar";
import { DELETE_USER, LIST_USERS } from "./graphql";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useMutation, useQuery } from "react-apollo";

import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";

const t = i18n.ns("app-identity/admin/users/data-list");

const UsersDataList = () => {
    const { identity } = useSecurity();

    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const listQuery = useQuery(LIST_USERS);

    const [deleteIt, deleteMutation] = useMutation(DELETE_USER, {
        refetchQueries: [{ query: LIST_USERS }]
    });

    const { showConfirmation } = useConfirmationDialog();

    const data = listQuery?.data?.security?.users?.data || [];

    const id = new URLSearchParams(location.search).get("id");

    const deleteItem = useCallback(
        item => {
            showConfirmation(async () => {
                const response = await deleteIt({
                    variables: item
                });

                const error = response?.data?.security?.deleteUser?.error;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(t`User "{email}" deleted.`({ email: item.email }));

                if (id === item.id) {
                    history.push(`/security/users`);
                }
            });
        },
        [id]
    );

    const loading = [listQuery, deleteMutation].find(item => item.loading);

    return (
        <DataList
            title={t`Security Users`}
            data={data}
            loading={Boolean(loading)}
            refresh={listQuery.refetch}
        >
            {({ data }) => (
                <ScrollList twoLine avatarList>
                    {data.map(item => (
                        <ListItem key={item.id} selected={item.id === id}>
                            <ListItemGraphic>
                                <Avatar
                                    renderImage={props => (
                                        <Image {...props} transform={{ width: 100 }} />
                                    )}
                                    src={item.avatar && item.avatar.src}
                                    fallbackText={item.fullName}
                                    alt={t`User's avatar.`}
                                />
                            </ListItemGraphic>
                            <ListItemText
                                onClick={() => history.push(`/security/users?id=${item.id}`)}
                            >
                                {item.fullName}
                                <ListItemTextSecondary>{item.email}</ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    {identity && identity.id !== item.id ? (
                                        <DeleteIcon onClick={() => deleteItem(item)} />
                                    ) : (
                                        <Tooltip
                                            placement={"bottom"}
                                            content={
                                                <span>{t`You can't delete your own user account.`}</span>
                                            }
                                        >
                                            <DeleteIcon disabled />
                                        </Tooltip>
                                    )}
                                </ListActions>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </ScrollList>
            )}
        </DataList>
    );
};

export default UsersDataList;
