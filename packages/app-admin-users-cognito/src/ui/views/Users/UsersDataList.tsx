import React, { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/react-hooks";
import orderBy from "lodash/orderBy.js";
import { Avatar, Button, Grid, Select, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import { useSecurity } from "@webiny/app-security";
import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions,
    ListItemGraphic,
    DataListModalOverlayAction,
    DataListModalOverlay,
    ListItemTextPrimary
} from "@webiny/ui/List/index.js";
import { DeleteIcon } from "@webiny/ui/List/DataList/icons/index.js";
import { useRouter, useSnackbar, useConfirmationDialog, SearchUI } from "@webiny/app-admin";
import { DELETE_USER, LIST_USERS } from "./graphql.js";
import { deserializeSorters } from "../utils.js";
import type { UserItem } from "~/UserItem.js";
import { Routes } from "~/routes.js";

const t = i18n.ns("app-identity/admin/users/data-list");

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
        label: t`Email A-Z`,
        sorter: "email_ASC"
    },
    {
        label: t`Email Z-A`,
        sorter: "email_DESC"
    }
];

interface FilterUsersCallable {
    (user: Pick<UserItem, "email" | "firstName" | "lastName">): boolean;
}

const UsersDataList = () => {
    const [filter, setFilter] = useState("");
    const [sort, setSort] = useState<string>(SORTERS[0].sorter);
    const { identity } = useSecurity();
    const { goToRoute } = useRouter();
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog({
        dataTestId: "default-data-list.delete-dialog",
        title: "Delete user",
        message: "Are you sure you want to delete this user? This action cannot be undone."
    });

    const filterUsers = useCallback<FilterUsersCallable>(
        ({ email, firstName, lastName }) => {
            return (
                email.toLowerCase().includes(filter) ||
                firstName.toLowerCase().includes(filter) ||
                lastName.toLowerCase().includes(filter)
            );
        },
        [filter]
    );

    const sortUsers = useCallback(
        (users: UserItem[]) => {
            if (!sort) {
                return users;
            }
            const [key, sortBy] = deserializeSorters(sort);
            return orderBy(users, [key], [sortBy]);
        },
        [sort]
    );

    const { data: listUsers, loading: usersLoading } = useQuery(LIST_USERS);

    const [deleteIt, { loading: deleteLoading }] = useMutation(DELETE_USER, {
        refetchQueries: [{ query: LIST_USERS }]
    });

    const data = usersLoading && !listUsers ? [] : listUsers.adminUsers.users.data || [];
    const filteredData = filter === "" ? data : data.filter(filterUsers);
    const userList = sortUsers(filteredData);
    const id = new URLSearchParams(location.search).get("id");

    const deleteItem = useCallback(
        (item: Pick<UserItem, "id" | "email">) => {
            showConfirmation(async () => {
                const response = await deleteIt({
                    variables: item
                });

                const error = response?.data?.adminUsers?.deleteUser?.error;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(t`User "{email}" deleted.`({ email: item.email }));

                if (id === item.id) {
                    goToRoute(Routes.Users.List);
                }
            });
        },
        [id]
    );

    const usersDataListModalOverlay = useMemo(
        () => (
            <DataListModalOverlay>
                <Grid>
                    <Grid.Column span={12}>
                        <Select
                            value={sort}
                            onChange={setSort}
                            label={t`Sort by`}
                            options={SORTERS.map(({ label, sorter: value }) => ({
                                label,
                                value
                            }))}
                        />
                    </Grid.Column>
                </Grid>
            </DataListModalOverlay>
        ),
        [sort]
    );

    const loading = usersLoading || deleteLoading;

    return (
        <DataList
            title={t`Admin Users`}
            actions={
                <Button
                    text={t`New`}
                    icon={<AddIcon />}
                    size={"sm"}
                    className={"wby-ml-xs"}
                    data-testid="new-record-button"
                    onClick={() => {
                        goToRoute(Routes.Users.List, { new: true });
                    }}
                />
            }
            data={userList}
            loading={loading}
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search users...`}
                />
            }
            modalOverlay={usersDataListModalOverlay}
            modalOverlayAction={
                <DataListModalOverlayAction data-testid={"default-data-list.filter"} />
            }
            showOptions={{
                refresh: false
            }}
        >
            {({ data }: { data: UserItem[] }) => (
                <ScrollList data-testid="default-data-list">
                    {data.map(item => (
                        <ListItem
                            key={item.id}
                            selected={item.id === id}
                            style={{ height: "auto" }}
                        >
                            <ListItemGraphic>
                                <Avatar
                                    image={
                                        <Avatar.Image
                                            src={item.avatar ? item.avatar.src : item.gravatar}
                                            alt={item.firstName}
                                        />
                                    }
                                    fallback={
                                        <Avatar.Fallback delayMs={0}>
                                            {item.firstName.charAt(0)}
                                        </Avatar.Fallback>
                                    }
                                />
                            </ListItemGraphic>
                            <ListItemText
                                onClick={() => {
                                    goToRoute(Routes.Users.List, { id: item.id });
                                }}
                            >
                                <ListItemTextPrimary>
                                    {item.firstName} {item.lastName}
                                </ListItemTextPrimary>
                                <ListItemTextSecondary>{item.email}</ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    {identity && identity.id !== item.id ? (
                                        <DeleteIcon
                                            onClick={() => deleteItem(item)}
                                            data-testid={"default-data-list.delete"}
                                        />
                                    ) : (
                                        <Tooltip
                                            content={
                                                <span>{t`You can't delete your own user account.`}</span>
                                            }
                                            trigger={<DeleteIcon disabled />}
                                        />
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
