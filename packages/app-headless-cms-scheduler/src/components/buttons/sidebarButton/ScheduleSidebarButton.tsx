import React from "react";
import { SidebarFooterContainer } from "@webiny/app-headless-cms/admin/views/contentEntries/Table/Sidebar";
import { Button, IconContainer, Icon } from "./SidebarButton.styled";
import { Typography } from "@webiny/ui/Typography";

export interface ScheduleButtonProps {
    onClick: () => void;
}

export const ScheduleButton = (props: ScheduleButtonProps) => {
    return (
        <Button onClick={props.onClick}>
            <IconContainer>
                <Icon />
            </IconContainer>
            <Typography use={"subtitle2"}>{"Schedule"}</Typography>
        </Button>
    );
};
