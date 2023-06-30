import { BaseActionConfig } from "./BaseAction";
import { ButtonAction, ButtonActionType } from "./ButtonAction";
import { MenuItemAction, MenuItemActionType } from "./MenuItemAction";

export type ActionsConfig = (
    | BaseActionConfig<ButtonActionType>
    | BaseActionConfig<MenuItemActionType>
)[];

export const Actions = {
    ButtonAction,
    MenuItemAction
    // useMenuItemComponents: useMenuItemComponents as unknown as MenuItemActionProviderContext
};

// Actions.useMenuItemComponents
