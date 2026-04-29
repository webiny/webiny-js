import React from "react";
import { NavigationRenderer, useAdminConfig } from "@webiny/app-admin";
import { Sidebar } from "@webiny/admin-ui";
import { SidebarMenuItems } from "./SidebarMenuItems.js";
import { SimpleLink } from "@webiny/app-admin";

export const Navigation = NavigationRenderer.createDecorator(() => {
    return function Navigation() {
        const { menus, title, logo } = useAdminConfig();

        const titleElement = <SimpleLink to={"/"}>{title}</SimpleLink>;
        const icon = (
            <SimpleLink to={"/"}>
                <Sidebar.Icon element={logo.squareLogo} label={"Webiny"} />
            </SimpleLink>
        );

        const hasFooterMenus = menus.some(m => (m.tags || []).includes("footer"));

        return (
            <Sidebar
                title={titleElement}
                icon={icon}
                footer={
                    hasFooterMenus ? (
                        <SidebarMenuItems menus={menus} where={{ tags: ["footer"] }} />
                    ) : undefined
                }
            >
                <SidebarMenuItems menus={menus} />
            </Sidebar>
        );
    };
});
