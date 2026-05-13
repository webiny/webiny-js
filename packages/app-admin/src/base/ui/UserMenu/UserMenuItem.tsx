import React from "react";
import { createVoidComponent, makeDecoratable } from "@webiny/react-composition";
import type {
    DropdownMenuItemIconProps,
    DropdownMenuItemButtonProps
} from "@webiny/admin-ui/DropdownMenu/components/DropdownMenuItem.js";

// UserMenuItem
type UserMenuItemRendererProps = DropdownMenuItemButtonProps;

const UserMenuItemRenderer = makeDecoratable(
    "UserMenuItemRenderer",
    createVoidComponent<UserMenuItemRendererProps>()
);

const UserMenuItem = makeDecoratable("UserMenuItem", (props: UserMenuItemRendererProps) => {
    return <UserMenuItemRenderer {...props} />;
});

// UserMenuItem > Icon
type UserMenuItemIconRendererProps = DropdownMenuItemIconProps;

const UserMenuItemIconRenderer = makeDecoratable(
    "UserMenuItemIcon",
    createVoidComponent<UserMenuItemIconRendererProps>()
);

const UserMenuItemIcon = makeDecoratable(
    "UserMenuItemIcon",
    (props: UserMenuItemIconRendererProps) => {
        return <UserMenuItemIconRenderer {...props} />;
    }
);

export {
    UserMenuItem,
    UserMenuItemRenderer,
    UserMenuItemIcon,
    UserMenuItemIconRenderer,
    type UserMenuItemRendererProps,
    type UserMenuItemIconRendererProps
};
