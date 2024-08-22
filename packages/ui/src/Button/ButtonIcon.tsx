import React from "react";

export interface ButtonIconProps {
    icon: React.ReactNode;
}

export const ButtonIcon = (props: ButtonIconProps) => <>{props.icon}</>;
