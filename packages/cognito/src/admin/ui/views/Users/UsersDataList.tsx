import React, { useCallback, useEffect, useMemo, useState } from "react";
import orderBy from "lodash/orderBy.js";
import { useFeature } from "@webiny/app";
import { Avatar, Button, Grid, Select, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import { useSecurity } from "@webiny/app-admin";
import { List, DataList, DataListModal, DeleteIcon } from "@webiny/admin-ui";
import { useRouter, useSnackbar, useConfirmationDialog, SearchUI } from "@webiny/app-admin";
import { ListUsersFeature } from "~/admin/features/users/listUsers/index.js";
import { DeleteUserFeature } from "~/admin/features/users/deleteUser/index.js";
import { deserializeSorters } from "../utils.js";
import { Routes } from "~/admin/routes.js";
import type { UserItem } from "~/admin/ui/UserItem.js";

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
    const [users, setUsers] = useState<UserItem[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const { identity } = useSecurity();
    const { goToRoute } = useRouter();
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog({
        dataTestId: "default-data-list.delete-dialog",
        title: "Delete user",
        message: "Are you sure you want to delete this user? This action cannot be undone."
    });

    const { useCase: listUsers } = useFeature(ListUsersFeature);
    const { useCase: deleteUser } = useFeature(DeleteUserFeature);

    const fetchUsers = useCallback(() => {
        setUsersLoading(true);
        listUsers.execute().then(data => {
            setUsers((data || []) as UserItem[]);
            setUsersLoading(false);
        });
    }, [listUsers]);

    useEffect(() => {
        fetchUsers();
    }, []);

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
        (list: UserItem[]) => {
            if (!sort) {
                return list;
            }
            const [key, sortBy] = deserializeSorters(sort);
            return orderBy(list, [key], [sortBy]);
        },
        [sort]
    );

    const filteredData = filter === "" ? users : users.filter(filterUsers);
    const userList = sortUsers(filteredData);
    const id = new URLSearchParams(location.search).get("id");

    const deleteItem = useCallback(
        (item: Pick<UserItem, "id" | "email">) => {
            showConfirmation(async () => {
                setDeleteLoading(true);
                try {
                    await deleteUser.execute({ id: item.id });
                    showSnackbar(t`User "{email}" deleted.`({ email: item.email }));
                    fetchUsers();

                    if (id === item.id) {
                        goToRoute(Routes.Users.List);
                    }
                } catch (error) {
                    const message = error instanceof Error ? error.message : "Unknown error";
                    showSnackbar(message);
                } finally {
                    setDeleteLoading(false);
                }
            });
        },
        [id, deleteUser, fetchUsers]
    );

    const usersDataListModalOverlay = useMemo(
        () => (
            <DataListModal.Content>
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
            </DataListModal.Content>
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
                    className={"ml-xs"}
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
            modalOverlayAction={<DataListModal.Trigger data-testid={"default-data-list.filter"} />}
            showOptions={{
                refresh: false
            }}
        >
            {({ data }: { data: UserItem[] }) => (
                <List data-testid="default-data-list">
                    {data.map(item => (
                        <List.Item
                            key={item.id}
                            selected={item.id === id}
                            title={`${item.firstName} ${item.lastName}`}
                            description={item.email}
                            icon={
                                <Avatar
                                    image={
                                        <Avatar.Image
                                            src={item.avatar ? item.avatar.src : undefined}
                                            alt={item.firstName}
                                        />
                                    }
                                    fallback={
                                        <Avatar.Fallback delayMs={0}>
                                            {item.firstName ? item.firstName.charAt(0) : "A"}
                                        </Avatar.Fallback>
                                    }
                                />
                            }
                            onClick={() => {
                                goToRoute(Routes.Users.List, { id: item.id });
                            }}
                            actions={
                                identity && identity.id !== item.id ? (
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
                                )
                            }
                        />
                    ))}
                </List>
            )}
        </DataList>
    );
};

export default UsersDataList;
