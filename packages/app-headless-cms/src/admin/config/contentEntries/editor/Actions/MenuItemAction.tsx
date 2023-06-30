import React from "react";
import { BaseAction, BaseActionProps } from "./BaseAction";

export type MenuItemActionType = "menu-item-action";
export type MenuItemActionProps = Omit<BaseActionProps, "$type">;

export const MenuItemAction: React.FC<MenuItemActionProps> = props => {
    return <BaseAction {...props} $type={"menu-item-action"} />;
};
