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
import { useCarManufacturersDataList } from "./hooks/useCarManufacturersDataList";

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

const CarManufacturersDataList = () => {
    const {
        carManufacturers,
        loading,
        currentCarManufacturerId,
        currentCarManufacturer,
        editCarManufacturer,
        deleteCarManufacturer
    } = useCarManufacturersDataList({ sorters });

    return (
        <DataList
            loading={loading}
            actions={
                <ButtonSecondary onClick={currentCarManufacturer}>
                    <ButtonIcon icon={<AddIcon />} /> {"New Car Manufacturer"}
                </ButtonSecondary>
            }
            sorters={[]}
            data={carManufacturers}
            title={"Car Manufacturers"}
        >
            {({ data }) => (
                <ScrollList>
                    {data.map(item => (
                        <ListItem key={item.id} selected={item.id === currentCarManufacturerId}>
                            <ListItemText onClick={() => editCarManufacturer(item.id)}>
                                {item.id}
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    <DeleteIcon onClick={() => deleteCarManufacturer(item)} />
                                </ListActions>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </ScrollList>
            )}
        </DataList>
    );
};

export default CarManufacturersDataList;
