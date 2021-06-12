import React from "react";
import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemMeta,
    ListActions
} from "@webiny/ui/List";

import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
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
        newTargetDataModel,
        editTargetDataModel,
        deleteTargetDataModel,
        setSort
    } = useTargetDataModelsDataList();

    return (
        <DataList
            loading={loading}
            actions={
                <ButtonSecondary onClick={newTargetDataModel}>
                    <ButtonIcon icon={<AddIcon />} />
                    New Target Data Model
                </ButtonSecondary>
            }
            sorters={sorters}
            setSorters={setSort}
            data={targetDataModels}
            title={"Target Data Models"}
        >
            {({ data }) => (
                <ScrollList>
                    {data.map(item => (
                        <ListItem key={item.id} selected={item.id === currentTargetDataModelId}>
                            <ListItemText onClick={() => editTargetDataModel(item.id)}>
                                {item.title}
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
