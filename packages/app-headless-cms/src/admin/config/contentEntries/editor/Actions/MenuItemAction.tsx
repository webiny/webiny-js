import React from "react";
import { useOptionsMenuItem } from "@webiny/app-admin";
import { BaseAction, BaseActionProps } from "./BaseAction";

export type MenuItemActionType = "menu-item-action";
export type MenuItemActionProps = Omit<BaseActionProps, "$type">;

export const BaseMenuItemAction = (props: MenuItemActionProps) => {
    return <BaseAction {...props} $type={"menu-item-action"} />;
};

export const MenuItemAction = Object.assign(BaseMenuItemAction, { useOptionsMenuItem });
