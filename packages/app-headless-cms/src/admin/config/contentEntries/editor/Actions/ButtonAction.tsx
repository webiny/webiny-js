import React from "react";
import { useButtons } from "@webiny/app-admin";
import { BaseAction, BaseActionProps } from "./BaseAction";

export type ButtonActionType = "button-action";
export type ButtonActionProps = Omit<BaseActionProps, "$type">;

export const BaseButtonAction = (props: ButtonActionProps) => {
    return <BaseAction {...props} $type={"button-action"} />;
};

export const ButtonAction = Object.assign(BaseButtonAction, { useButtons });
