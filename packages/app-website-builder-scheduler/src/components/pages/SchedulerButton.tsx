import React from "react";
import { Sidebar } from "@webiny/admin-ui";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/cell_tower.svg";

export interface SchedulerButtonProps {
    onClick: () => void;
}

export const SchedulerButton = (props: SchedulerButtonProps) => {
    return (
        <div className={"list-none"}>
            <Sidebar.Item
                onClick={props.onClick}
                text={"Schedule"}
                icon={<Sidebar.Item.Icon element={<ScheduleIcon />} label={"Schedule"} />}
            />
        </div>
    );
};
