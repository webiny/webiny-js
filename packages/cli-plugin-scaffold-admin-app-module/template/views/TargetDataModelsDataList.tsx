import React from "react";
import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemMeta,
    ListActions
} from "@webiny/ui/List";
import { useTargetDataModelsDataList } from "./hooks/useTargetDataModelsDataList";

/**
 * Renders a list of all Target Data Model entries. Includes basic deletion, pagination, and sorting capabilities.
 * The data querying functionality is located in the `useTargetDataModelsDataList` React hook.
 */

// By default, we are able to sort entries by time of creation (ascending and descending).
// More sorters can be added, but not that further adjustments will be needed on the GraphQL API side.
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
