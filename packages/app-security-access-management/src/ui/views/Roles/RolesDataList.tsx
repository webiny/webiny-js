import React, { useCallback, useMemo, useState } from "react";
import orderBy from "lodash/orderBy.js";
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
import { useRouter, SearchUI, useSnackbar, useConfirmationDialog } from "@webiny/app-admin";
import { useQuery, useMutation } from "@apollo/react-hooks";
import type { ListRolesResponse } from "./graphql.js";
import { LIST_ROLES, DELETE_ROLE } from "./graphql.js";
import { deserializeSorters } from "../utils.js";
import type { Role } from "~/types.js";
import { Button, Grid, Select, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
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

export interface RolesDataListProps {
    activeId: string | undefined;
}

export const RolesDataList = ({ activeId }: RolesDataListProps) => {
    const [filter, setFilter] = useState("");
    const [sort, setSort] = useState(SORTERS[0].sorter);
    const { goToRoute } = useRouter();
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog({
        dataTestId: "default-data-list.delete-dialog"
    });

    const { data: listResponse, loading: listLoading } = useQuery<ListRolesResponse>(LIST_ROLES);

    const [deleteIt, { loading: deleteLoading }] = useMutation(DELETE_ROLE, {
        refetchQueries: [{ query: LIST_ROLES }]
    });

    const data = listLoading && !listResponse ? [] : listResponse?.security.roles.data || [];

    const filterRole = useCallback(
        ({ name, slug, description }: Role) => {
            return (
                name.toLowerCase().includes(filter) ||
                slug.toLowerCase().includes(filter) ||
                (description && description.toLowerCase().includes(filter))
            );
        },
        [filter]
    );

    const sortRoles = useCallback(
        (roles: Role[]) => {
            if (!sort) {
                return roles;
            }
            const [key, sortBy] = deserializeSorters(sort);
            return orderBy(roles, [key], [sortBy]);
        },
        [sort]
    );

    const deleteItem = useCallback(
        (item: Role) => {
            showConfirmation(async () => {
                const { data } = await deleteIt({
                    variables: item
                });

                const { error } = data.security.deleteRole;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(t`Role "{slug}" deleted.`({ slug: item.slug }));

                if (activeId === item.id) {
                    goToRoute(Routes.Roles.List);
                }
            });
        },
        [activeId]
    );

    const rolesDataListModalOverlay = useMemo(
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

    const filteredData = filter === "" ? data : data.filter(filterRole);
    const groupList = sortRoles(filteredData);

    return (
        <DataList
            title={t`Roles`}
            actions={
                <Button
                    text={t`New`}
                    icon={<AddIcon />}
                    size={"sm"}
                    className={"ml-xs"}
                    data-testid="new-record-button"
                    onClick={() => {
                        goToRoute(Routes.Roles.List, { new: true });
                    }}
                />
            }
            data={groupList}
            loading={listLoading || deleteLoading}
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search roles...`}
                />
            }
            modalOverlay={rolesDataListModalOverlay}
            modalOverlayAction={
                <DataListModalOverlayAction data-testid={"default-data-list.filter"} />
            }
        >
            {({ data }: { data: Role[] }) => (
                <ScrollList data-testid="default-data-list">
                    {data.map(item => (
                        <ListItem key={item.id} selected={item.id === activeId}>
                            <ListItemText
                                onClick={() => {
                                    goToRoute(Routes.Roles.List, { id: item.id });
                                }}
                            >
                                <ListItemTextPrimary>{item.name}</ListItemTextPrimary>
                                <ListItemTextSecondary>{item.description}</ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    {item.system || item.plugin ? (
                                        <Tooltip
                                            content={
                                                <span>
                                                    {item.system
                                                        ? t`Cannot delete system roles.`
                                                        : t`Cannot delete roles registered via extensions.`}
                                                </span>
                                            }
                                            trigger={<DeleteIcon disabled />}
                                        />
                                    ) : (
                                        <DeleteIcon
                                            onClick={() => deleteItem(item)}
                                            data-testid={"default-data-list.delete"}
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
