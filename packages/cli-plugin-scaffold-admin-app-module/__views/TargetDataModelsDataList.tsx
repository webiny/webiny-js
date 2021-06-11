import React, { useCallback, useEffect, useMemo } from "react";
import dotProp from "dot-prop-immutable";
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
import { Target_data_modelItem, DataListChildProps } from "../types";
import { DELETE_TARGET_DATA_MODEL, LIST_TARGET_DATA_MODELS } from "./graphql";
import { removeFromListCache } from "./cache";
import { QueryResult } from "@apollo/react-common";

const t = i18n.ns("admin-app-target_data_model/data-list");

interface Props {
    sortBy: string;
    setSortBy: (value: string) => void;
    limit: number;
    setLimit: (value: number) => void;
    sorters: { label: string; value: string }[];
}

const extractQueryGraphQLError = (listQuery: QueryResult): string | null => {
    if (!listQuery.error || !listQuery.error.message) {
        return null;
    }
    return listQuery.error.message;
};

const TargetDataModelsDataList: React.FunctionComponent<Props> = ({ sortBy, setSortBy, limit, sorters }) => {
    const { history } = useRouter();

    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog();
    const listVariables = {
        sort: [sortBy],
        limit
    };
    const listQuery = useQuery(LIST_TARGET_DATA_MODELS, {
        variables: listVariables
    });
    const [deleteTargetDataModel, deleteMutation] = useMutation(DELETE_TARGET_DATA_MODEL);

    const id = new URLSearchParams(location.search).get("id");

    const deleteTargetDataModelItem = useCallback(
        (target_data_model: Target_data_modelItem) => {
            showConfirmation(async () => {
                await deleteTargetDataModel({
                    variables: {
                        id: target_data_model.id
                    },
                    update: (cache, response) => {
                        const error = dotProp.get(
                            response,
                            "data.target_data_models.deleteTargetDataModel.error",
                            null
                        );
                        if (error) {
                            return showSnackbar(error.message);
                        }
                        removeFromListCache(cache, listVariables, target_data_model);

                        showSnackbar(t`Target_data_model "{title}" deleted.`({ title: target_data_model.title }));

                        if (id === target_data_model.id) {
                            history.push(`/target-data-models`);
                        }
                    }
                });
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

    const data = listQuery.loading
        ? []
        : dotProp.get(listQuery, "data.target_data_models.listTarget_data_models.data", []);
    const error = extractQueryGraphQLError(listQuery);
    // there is a possibility to receive graphql errors so show those as well
    useEffect(() => {
        if (!error) {
            return;
        }
        showSnackbar(error);
    }, [error]);
    return (
        <DataList
            loading={loading}
            title={t`Target_data_models`}
            data={data}
            actions={
                <ButtonSecondary
                    data-testid="new-target_data_model-button"
                    onClick={() => history.push("/target-data-models/?new=true")}
                >
                    <ButtonIcon icon={<AddIcon />} /> {t`New Target_data_model`}
                </ButtonSecondary>
            }
            modalOverlay={sortOverlay}
            modalOverlayAction={<DataListModalOverlayAction icon={<FilterIcon />} />}
        >
            {({ data }: DataListChildProps) => (
                <ScrollList data-testid="target_data_model-data-list">
                    {(data || []).map(item => (
                        <ListItem key={item.id} selected={item.id === id}>
                            <ListItemText onClick={() => history.push(`/target-data-models?id=${item.id}`)}>
                                {item.title}
                                {item.description && (
                                    <ListItemTextSecondary>
                                        {item.description}
                                    </ListItemTextSecondary>
                                )}
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    <DeleteIcon onClick={() => deleteTargetDataModelItem(item)} />
                                </ListActions>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </ScrollList>
            )}
        </DataList>
    );
};

export default TargetDataModelsDataList;
