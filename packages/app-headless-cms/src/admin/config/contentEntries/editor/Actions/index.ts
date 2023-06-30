import { BaseActionConfig } from "./BaseAction";
import { ButtonAction, ButtonActionType } from "./ButtonAction";
import { MenuItemAction, MenuItemActionType } from "./MenuItemAction";
import { useButtons, useOptionsMenuItem } from "@webiny/app-admin";

export type ActionsConfig = (
    | BaseActionConfig<ButtonActionType>
    | BaseActionConfig<MenuItemActionType>
)[];

export const Actions = {
    ButtonAction,
    MenuItemAction,
    useButtons,
    useOptionsMenuItem
};
