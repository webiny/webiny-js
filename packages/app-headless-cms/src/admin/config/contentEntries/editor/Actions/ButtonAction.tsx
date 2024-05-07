import React from "react";
import { makeDecoratable, useButtons } from "@webiny/app-admin";
import { BaseAction, BaseActionProps } from "./BaseAction";

export type ButtonActionType = "button-action";
export type ButtonActionProps = Omit<BaseActionProps, "$type">;

export const BaseButtonAction = makeDecoratable("ButtonAction", (props: ButtonActionProps) => {
    return <BaseAction {...props} $type={"button-action"} />;
});

export const ButtonAction = Object.assign(BaseButtonAction, { useButtons });
