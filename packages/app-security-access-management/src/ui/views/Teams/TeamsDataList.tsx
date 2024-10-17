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
    DataListModalOverlayAction,
    DataListModalOverlay
} from "@webiny/ui/List";
import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { LIST_TEAMS, DELETE_TEAM, ListTeamsResponse } from "./graphql";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import { deserializeSorters } from "../utils";
import { Team } from "~/types";

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
    // TODO @ts-refactor delete and go up the tree and sort it out
    [key: string]: any;
}

export const TeamsDataList = () => {
    const [filter, setFilter] = useState("");
    const [sort, setSort] = useState(SORTERS[0].sorter);
    const { history, location } = useRouter();
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog({
        dataTestId: "default-data-list.delete-dialog"
    });

    const { data: listResponse, loading: listLoading } = useQuery<ListTeamsResponse>(LIST_TEAMS);

    const [deleteIt, { loading: deleteLoading }] = useMutation(DELETE_TEAM, {
        refetchQueries: [{ query: LIST_TEAMS }]
    });

    const data = listLoading && !listResponse ? [] : listResponse?.security.teams.data || [];
    const id = new URLSearchParams(location.search).get("id");

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

                const { error } = data.security.deleteTeam;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(t`Team "{slug}" deleted.`({ slug: item.slug }));

                if (id === item.id) {
                    history.push(`/access-management/teams`);
                }
            });
        },
        [id]
    );

    const teamsDataListModalOverlay = useMemo(
        () => (
            <DataListModalOverlay>
                <Grid>
                    <Cell span={12}>
                        <Select value={sort} onChange={setSort} label={t`Sort by`}>
                            {SORTERS.map(({ label, sorter }) => {
                                return (
                                    <option key={label} value={sorter}>
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

    const filteredData = filter === "" ? data : data.filter(filterTeam);
    const teamList = sortTeams(filteredData);

    return (
        <DataList
            title={t`Teams`}
            actions={
                <ButtonSecondary
                    data-testid="new-record-button"
                    onClick={() => history.push("/access-management/teams?new=true")}
                >
                    <ButtonIcon icon={<AddIcon />} /> {t`New Team`}
                </ButtonSecondary>
            }
            data={teamList}
            loading={listLoading || deleteLoading}
            search={
                <SearchUI value={filter} onChange={setFilter} inputPlaceholder={t`Search Teams`} />
            }
            modalOverlay={teamsDataListModalOverlay}
            modalOverlayAction={
                <DataListModalOverlayAction
                    icon={<FilterIcon />}
                    data-testid={"default-data-list.filter"}
                />
            }
        >
            {({ data }: { data: Team[] }) => (
                <ScrollList data-testid="default-data-list">
                    {data.map(item => (
                        <ListItem key={item.id} selected={item.id === id}>
                            <ListItemText
                                onClick={() =>
                                    history.push(`/access-management/teams?id=${item.id}`)
                                }
                            >
                                {item.name}
                                <ListItemTextSecondary>{item.description}</ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                {item.system || item.plugin ? (
                                    <Tooltip
                                        placement={"bottom"}
                                        content={
                                            <span>
                                                {item.system
                                                    ? t`Cannot delete system teams.`
                                                    : t`Cannot delete teams created via extensions.`}
                                            </span>
                                        }
                                    >
                                        <DeleteIcon disabled />
                                    </Tooltip>
                                ) : (
                                    <DeleteIcon
                                        onClick={() => deleteItem(item)}
                                        data-testid={"default-data-list.delete"}
                                    />
                                )}
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </ScrollList>
            )}
        </DataList>
    );
};
