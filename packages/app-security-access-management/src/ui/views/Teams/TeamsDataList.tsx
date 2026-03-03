import React, { useCallback, useMemo, useState } from "react";
import orderBy from "lodash/orderBy.js";
import { Button, Grid, Select, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    DataListModalOverlayAction,
    DataListModalOverlay,
    ListItemTextPrimary,
    ListActions
} from "@webiny/ui/List/index.js";
import { DeleteIcon } from "@webiny/ui/List/DataList/icons/index.js";
import { useRouter, useSnackbar, useConfirmationDialog, SearchUI } from "@webiny/app-admin";
import { useQuery, useMutation } from "@apollo/client/react";
import type { IDeleteTeamResponse, ListTeamsResponse } from "./graphql.js";
import { LIST_TEAMS, DELETE_TEAM } from "./graphql.js";
import { deserializeSorters } from "../utils.js";
import type { Team } from "~/types.js";
import { Routes } from "~/routes.js";

const t = i18n.ns("app-security/admin/teams/data-list");

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

export interface TeamsDataListProps {
    activeId: string | undefined;
}

export const TeamsDataList = ({ activeId }: TeamsDataListProps) => {
    const [filter, setFilter] = useState("");
    const [sort, setSort] = useState(SORTERS[0].sorter);
    const { goToRoute } = useRouter();
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog({
        dataTestId: "default-data-list.delete-dialog"
    });

    const { data: listResponse, loading: listLoading } = useQuery<ListTeamsResponse>(LIST_TEAMS);

    const [deleteIt, { loading: deleteLoading }] = useMutation<IDeleteTeamResponse>(DELETE_TEAM, {
        refetchQueries: [{ query: LIST_TEAMS }]
    });

    const data = listLoading && !listResponse ? [] : listResponse?.security.teams.data || [];

    const filterTeam = useCallback(
        ({ name, slug, description }: Team) => {
            return (
                name.toLowerCase().includes(filter) ||
                slug.toLowerCase().includes(filter) ||
                (description && description.toLowerCase().includes(filter))
            );
        },
        [filter]
    );

    const sortTeams = useCallback(
        (teams: Team[]) => {
            if (!sort) {
                return teams;
            }
            const [key, sortBy] = deserializeSorters(sort);
            return orderBy(teams, [key], [sortBy]);
        },
        [sort]
    );

    const deleteItem = useCallback(
        (item: Team) => {
            showConfirmation(async () => {
                const { data } = await deleteIt({
                    variables: item
                });

                const { error } = data!.security.deleteTeam;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(t`Team "{slug}" deleted.`({ slug: item.slug }));

                if (activeId === item.id) {
                    goToRoute(Routes.Teams.List);
                }
            });
        },
        [activeId]
    );

    const teamsDataListModalOverlay = useMemo(
        () => (
            <DataListModalOverlay>
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
            </DataListModalOverlay>
        ),
        [sort]
    );

    const filteredData = filter === "" ? data : data.filter(filterTeam);
    const teamList = sortTeams(filteredData);

    return (
        <DataList
            title={t`Teams`}
            actions={
                <Button
                    text={t`New`}
                    icon={<AddIcon />}
                    size={"sm"}
                    className={"ml-xs"}
                    data-testid="new-record-button"
                    onClick={() => {
                        goToRoute(Routes.Teams.List, { new: true });
                    }}
                />
            }
            data={teamList}
            loading={listLoading || deleteLoading}
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search teams...`}
                />
            }
            modalOverlay={teamsDataListModalOverlay}
            modalOverlayAction={
                <DataListModalOverlayAction data-testid={"default-data-list.filter"} />
            }
        >
            {({ data }: { data: Team[] }) => (
                <ScrollList data-testid="default-data-list">
                    {data.map(item => (
                        <ListItem key={item.id} selected={item.id === activeId}>
                            <ListItemText
                                onClick={() => {
                                    goToRoute(Routes.Teams.List, { id: item.id });
                                }}
                            >
                                <ListItemTextPrimary>{item.name}</ListItemTextPrimary>
                                <ListItemTextSecondary>
                                    {item.description ?? "(no description)"}
                                </ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    {item.system || item.plugin ? (
                                        <Tooltip
                                            content={
                                                <span>
                                                    {item.system
                                                        ? t`Cannot delete system teams.`
                                                        : t`Cannot delete teams created via extensions.`}
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
