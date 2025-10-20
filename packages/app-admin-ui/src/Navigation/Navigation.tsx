import React from "react";
import { NavigationRenderer, useAdminConfig } from "@webiny/app-admin";
import { Sidebar } from "@webiny/admin-ui";
import { SidebarMenuItems } from "./SidebarMenuItems.js";
import { SimpleLink } from "@webiny/app-admin";
import { PinnedMenuItems } from "./PinnedMenuItems.js";

export const Navigation = NavigationRenderer.createDecorator(() => {
    return function Navigation() {
        const { menus, tenant } = useAdminConfig();

        const title = <SimpleLink to={"/"}>{tenant.name}</SimpleLink>;
        const icon = (
            <SimpleLink to={"/"}>
                <Sidebar.Icon element={tenant.logo} label={"Webiny"} />
            </SimpleLink>
        );

        return (
            <Sidebar
                title={title}
                icon={icon}
                footer={<SidebarMenuItems menus={menus} where={{ tags: ["footer"] }} />}
            >
                <PinnedMenuItems menuItems={menus} />
                <SidebarMenuItems menus={menus} />
            </Sidebar>
        );
    };
});
