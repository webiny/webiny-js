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
 * Renders a list of all TargetDataModel entries. Includes basic deletion, pagination, and sorting capabilities.
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
        refresh,
        pagination,
        setSort,
        newTargetDataModel,
        editTargetDataModel,
        deleteTargetDataModel,
        currentTargetDataModelId
    } = useTargetDataModelsDataList();

    return (
        <DataList
            title={"Target Data Models"}
            data={targetDataModels}
            loading={loading}
            refresh={refresh}
            pagination={pagination}
            sorters={sorters}
            setSorters={setSort}
            actions={
                <ButtonSecondary onClick={newTargetDataModel}>
                    <ButtonIcon icon={<AddIcon />} />
                    New Target Data Model
                </ButtonSecondary>
            }
        >
            {({ data }: { data: any[] }) => (
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
