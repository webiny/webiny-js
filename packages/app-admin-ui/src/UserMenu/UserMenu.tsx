import React from "react";
import {
    UserMenuRenderer as UserMenuRendererSpec,
    UserMenuHandle,
    useAdminConfig
} from "@webiny/app-admin";
import { DropdownMenu } from "@webiny/admin-ui";
import { useSecurity } from "@webiny/app-admin";

export const UserMenu = UserMenuRendererSpec.createDecorator(() => {
    return function UserMenu() {
        const security = useSecurity();
        const { userMenus } = useAdminConfig();

        if (!security || !security.identity) {
            return null;
        }

        const dropDownMenuItems = userMenus.map(m => {
            if (React.isValidElement(m.element)) {
                return React.cloneElement(m.element, { key: m.name });
            }

            return null;
        });

        return (
            <DropdownMenu
                trigger={<UserMenuHandle />}
                data-testid={"logged-in-user-menu-list"}
                className={"w-[220px]"}
            >
                {dropDownMenuItems}
            </DropdownMenu>
        );
    };
});
