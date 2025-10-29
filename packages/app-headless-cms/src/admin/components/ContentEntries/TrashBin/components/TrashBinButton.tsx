import React from "react";
import { Sidebar } from "@webiny/admin-ui";
import { ReactComponent as Delete } from "@webiny/icons/delete.svg";

export interface TrashBinButtonProps {
    onClick: () => void;
}

export const TrashBinButton = (props: TrashBinButtonProps) => {
    return (
        <div className={"list-none"}>
            <Sidebar.Item
                onClick={props.onClick}
                text={"Trash"}
                icon={<Sidebar.Item.Icon element={<Delete />} label={"Delete"} />}
            />
        </div>
    );
};
