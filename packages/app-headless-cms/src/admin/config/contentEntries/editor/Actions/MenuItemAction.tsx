import React from "react";
import { makeDecoratable, useOptionsMenuItem } from "@webiny/app-admin";
import { BaseAction, BaseActionProps } from "./BaseAction";

export type MenuItemActionType = "menu-item-action";
export type MenuItemActionProps = Omit<BaseActionProps, "$type">;

export const BaseMenuItemAction = makeDecoratable(
    "MenuItemAction",
    (props: MenuItemActionProps) => {
        return <BaseAction {...props} $type={"menu-item-action"} />;
    }
);

export const MenuItemAction = Object.assign(BaseMenuItemAction, { useOptionsMenuItem });
