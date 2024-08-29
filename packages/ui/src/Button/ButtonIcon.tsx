import React from "react";
import { Icon } from "~/Icon";

export interface ButtonIconProps {
    icon: React.ReactElement;
}

export const ButtonIcon = (props: ButtonIconProps) => {
    return <Icon {...props}/>;
};
