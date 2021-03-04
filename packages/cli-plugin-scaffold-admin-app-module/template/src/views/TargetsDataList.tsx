import React, { useCallback, useMemo, useState } from "react";
import { i18n } from "@webiny/app/i18n";
import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions,
    DataListModalOverlay,
    DataListModalOverlayAction
} from "@webiny/ui/List";
import { Select } from "@webiny/ui/Select";
import { Grid, Cell } from "@webiny/ui/Grid";

import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import { useRouter } from "@webiny/react-router";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useMutation, useQuery } from "@apollo/react-hooks";
import { TargetItem, DataListChildProps } from "../types";
import { DELETE_TARGET, LIST_TARGETS } from "./graphql";

const t = i18n.ns("admin-app-target/data-list");

const sorters = [
    {
        label: "Newest to oldest",
        value: "createdOn_DESC"
    },
    {
        label: "Oldest to newest",
        value: "createdOn_ASC"
    },
    {
        label: "Tile A-Z",
        value: "title_ASC"
    },
    {
        label: "Title Z-A",
        value: "title_DESC"
    }
];

const TargetsDataList = () => {
    const { history } = useRouter();
    const [sortBy, setSortBy] = useState(sorters[0].value);
    const [limit] = useState(20);

    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog();
    const listQuery = useQuery(LIST_TARGETS, {
        variables: {
            sort: [sortBy],
            limit
        }
    });
    const [deleteTarget, deleteMutation] = useMutation(DELETE_TARGET, {
        refetchQueries: [
            {
                query: LIST_TARGETS,
                variables: {
                    sort: [sortBy],
                    limit
                }
            }
        ]
    });

    const id = new URLSearchParams(location.search).get("id");

    const deleteTargetItem = useCallback(
        (item: TargetItem) => {
            showConfirmation(async () => {
                const response = await deleteTarget({
                    variables: {
                        id: item.id
                    }
                });

                const { error } = response.data.targets.deleteTarget;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(t`Target "{title}" deleted.`({ code: item.title }));

                if (id === item.id) {
                    history.push(`/targets`);
                }

                // Reload page
                window.location.reload();
            });
        },
        [id]
    );

    const sortOverlay = useMemo(
        () => (
            <DataListModalOverlay>
                <Grid>
                    <Cell span={12}>
                        <Select value={sortBy} onChange={setSortBy} label={t`Sort by`}>
                            {sorters.map(({ label, value }) => {
                                return (
                                    <option key={label} value={value}>
                                        {label}
                                    </option>
                                );
                            })}
                        </Select>
                    </Cell>
                </Grid>
            </DataListModalOverlay>
        ),
        [sortBy]
    );

    const loading = [listQuery, deleteMutation].some(item => !!item.loading);

    const data = listQuery.loading ? [] : listQuery.data.targets.listTargets.data;

    return (
        <DataList
            loading={loading}
            title={t`Targets`}
            data={data}
            actions={
                <ButtonSecondary
                    data-testid="new-target-button"
                    onClick={() => history.push("/targets/?new=true")}
                >
                    <ButtonIcon icon={<AddIcon />} /> {t`New Target`}
                </ButtonSecondary>
            }
            modalOverlay={sortOverlay}
            modalOverlayAction={<DataListModalOverlayAction icon={<FilterIcon />} />}
        >
            {({ data }: DataListChildProps) => (
                <ScrollList data-testid="target-data-list">
                    {(data || []).map(item => (
                        <ListItem key={item.id} selected={item.id === id}>
                            <ListItemText onClick={() => history.push(`/targets?id=${item.id}`)}>
                                {item.title}
                                {item.description && (
                                    <ListItemTextSecondary>
                                        {item.description}
                                    </ListItemTextSecondary>
                                )}
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    <DeleteIcon onClick={() => deleteTargetItem(item)} />
                                </ListActions>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </ScrollList>
            )}
        </DataList>
    );
};

export default TargetsDataList;
