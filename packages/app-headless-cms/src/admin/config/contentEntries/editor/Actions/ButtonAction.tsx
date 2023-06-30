import React from "react";
import { BaseAction, BaseActionProps } from "./BaseAction";

export type ButtonActionType = "button-action";
export type ButtonActionProps = Omit<BaseActionProps, "$type">;

export const ButtonAction: React.FC<ButtonActionProps> = props => {
    return <BaseAction {...props} $type={"button-action"} />;
};
