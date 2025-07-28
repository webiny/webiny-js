import React from "react";
import { Sidebar } from "@webiny/admin-ui";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/cell_tower.svg";

export interface ScheduleButtonProps {
    onClick: () => void;
}

export const SchedulerButton = (props: ScheduleButtonProps) => {
    return (
        <div className={"wby-list-none"}>
            <Sidebar.Item
                onClick={props.onClick}
                text={"Schedule"}
                icon={<Sidebar.Item.Icon element={<ScheduleIcon />} label={"Schedule"} />}
            />
        </div>
    );
};
