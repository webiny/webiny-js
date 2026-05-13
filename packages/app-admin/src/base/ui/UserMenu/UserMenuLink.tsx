import React from "react";
import { createVoidComponent, makeDecoratable } from "@webiny/react-composition";
import type {
    DropdownMenuItemIconProps,
    DropdownMenuItemLinkProps
} from "@webiny/admin-ui/DropdownMenu/components/DropdownMenuLink.js";

// UserMenuLink
type UserMenuLinkRendererProps = DropdownMenuItemLinkProps;

const UserMenuLinkRenderer = makeDecoratable(
    "UserMenuLinkRenderer",
    createVoidComponent<UserMenuLinkRendererProps>()
);

const UserMenuLink = makeDecoratable("UserMenuLink", (props: UserMenuLinkRendererProps) => {
    return <UserMenuLinkRenderer {...props} />;
});

// UserMenuLink > Icon
type DropdownMenuItemIconRendererProps = DropdownMenuItemIconProps;

const UserMenuLinkIconRenderer = makeDecoratable(
    "UserMenuLinkIcon",
    createVoidComponent<DropdownMenuItemIconProps>()
);

const UserMenuLinkIcon = makeDecoratable(
    "UserMenuLinkIcon",
    (props: DropdownMenuItemIconRendererProps) => {
        return <UserMenuLinkIconRenderer {...props} />;
    }
);

export {
    UserMenuLink,
    UserMenuLinkRenderer,
    UserMenuLinkIcon,
    UserMenuLinkIconRenderer,
    type UserMenuLinkRendererProps,
    type DropdownMenuItemIconRendererProps
};
