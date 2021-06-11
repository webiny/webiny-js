import React, { useMemo } from "react";
import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemMeta,
    ListActions,
    ListItemTextSecondary,
    DataListModalOverlay,
    DataListModalOverlayAction
} from "@webiny/ui/List";

import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import { useTargetDataModelsDataList } from "./hooks/useTargetDataModelsDataList";

const sorters = [
    {
        label: "Newest to oldest",
        value: "createdOn_DESC"
    },
    {
        label: "Oldest to newest",
        value: "createdOn_ASC"
    }
];

const TargetDataModelsDataList = () => {
    const {
        targetDataModels,
        loading,
        currentTargetDataModelId,
        currentTargetDataModel,
        sort,
        setSort,
        editTargetDataModel,
        deleteTargetDataModel
    } = useTargetDataModelsDataList({ sorters });

    const targetDataModelsDataListModalOverlay = useMemo(
        () => (
            <DataListModalOverlay>
                <Grid>
                    <Cell span={12}>
                        <Select value={sort} onChange={setSort} label={"Sort by"}>
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
        [sort]
    );

    return (
        <DataList
            loading={loading}
            actions={
                <ButtonSecondary onClick={currentTargetDataModel}>
                    <ButtonIcon icon={<AddIcon />} /> {"New Target Data Model"}
                </ButtonSecondary>
            }
            data={targetDataModels}
            title={"Target_data_models"}
            modalOverlay={targetDataModelsDataListModalOverlay}
            modalOverlayAction={<DataListModalOverlayAction icon={<FilterIcon />} />}
        >
            {({ data }) => (
                <ScrollList>
                    {data.map(item => (
                        <ListItem key={item.id} selected={item.id === currentTargetDataModelId}>
                            <ListItemText onClick={() => editTargetDataModel(item.id)}>
                                {item.id}
                                <ListItemTextSecondary>
                                    {item.default && "Default target_data_model"}
                                </ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    <DeleteIcon onClick={() => deleteTargetDataModel(item)} />
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
