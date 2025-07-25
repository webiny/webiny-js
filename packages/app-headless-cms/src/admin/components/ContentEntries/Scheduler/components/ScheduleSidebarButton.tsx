import React from "react";
import { Button, Icon, IconContainer } from "./SidebarButton.styled";
import { Typography } from "@webiny/ui/Typography";

export interface ScheduleButtonProps {
    onClick: () => void;
}

export const SchedulerButton = (props: ScheduleButtonProps) => {
    return (
        <Button onClick={props.onClick}>
            <IconContainer>
                <Icon />
            </IconContainer>
            <Typography use={"subtitle2"}>{"Schedule"}</Typography>
        </Button>
    );
};
