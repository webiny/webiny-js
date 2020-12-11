import React, { useCallback, useState } from "react";
import { useMutation, useQuery } from "react-apollo";
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
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { Input } from "@webiny/ui/Input";
import { DELETE_USER, LIST_USERS } from "./graphql";
import { ReactComponent as SearchIcon } from "./search.svg";

const t = i18n.ns("app-identity/admin/users/data-list");

const UsersDataList = () => {
    const [filter, setFilter] = useState("");
    const { identity } = useSecurity();
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog();

    const filterUsers = useCallback(
        ({ login, firstName, lastName }) => {
            return (
                login.toLowerCase().includes(filter) ||
                firstName.toLowerCase().includes(filter) ||
                lastName.toLowerCase().includes(filter)
            );
        },
        [filter]
    );

    const { data: listUsers, loading: usersLoading, refetch: usersRefetch } = useQuery(LIST_USERS);

    const [deleteIt, { loading: deleteLoading }] = useMutation(DELETE_USER, {
        refetchQueries: [{ query: LIST_USERS }]
    });

    const data = usersLoading && !listUsers ? [] : listUsers.security.users.data || [];
    const filteredData = filter === "" ? data : data.filter(filterUsers);

    const login = new URLSearchParams(location.search).get("login");

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

                showSnackbar(t`User "{login}" deleted.`({ login: item.login }));

                if (login === item.login) {
                    history.push(`/security/users`);
                }
            });
        },
        [login]
    );

    const loading = usersLoading || deleteLoading;

    return (
        <DataList
            title={t`Security Users`}
            data={filteredData}
            loading={loading}
            refresh={usersRefetch}
            extraOptions={
                <Input
                    icon={<SearchIcon />}
                    placeholder={"Type to filter"}
                    value={filter}
                    onChange={setFilter}
                    autoComplete="off"
                />
            }
        >
            {({ data }) => (
                <ScrollList twoLine avatarList>
                    {data.map(item => (
                        <ListItem key={item.login} selected={item.login === login}>
                            <ListItemGraphic>
                                <Avatar
                                    renderImage={props => (
                                        <Image {...props} transform={{ width: 100 }} />
                                    )}
                                    src={item.avatar ? item.avatar.src : item.gravatar}
                                    fallbackText={item.firstName}
                                    alt={t`User's avatar.`}
                                />
                            </ListItemGraphic>
                            <ListItemText
                                onClick={() => history.push(`/security/users?login=${item.login}`)}
                            >
                                {item.firstName} {item.lastName}
                                <ListItemTextSecondary>{item.login}</ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    {identity && identity.id !== item.login ? (
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
