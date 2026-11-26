import React from "react";
import {
    createReactiveComponent,
    NavigationRenderer,
    TenantSelector,
    useAdminConfig
} from "@webiny/app-admin";
import { Sidebar } from "@webiny/admin-ui";
import { SidebarMenuItems } from "./SidebarMenuItems.js";
import { SimpleLink } from "@webiny/app-admin";
import { TenantAvatar, useTenantSwitcher } from "../TenantSelector.js";

export const Navigation = NavigationRenderer.createDecorator(() => {
    return createReactiveComponent(function Navigation() {
        const { menus, title } = useAdminConfig();
        const { current } = useTenantSwitcher().vm;

        // The current tenant's logo, so the collapsed rail still shows which tenant this is.
        const icon = (
            <SimpleLink to={"/"}>
                <TenantAvatar tenant={current ?? { id: "root", name: title, logo: null }} />
            </SimpleLink>
        );

        const hasFooterMenus = menus.some(m => (m.tags || []).includes("footer"));

        return (
            <Sidebar
                title={<TenantSelector title={title} />}
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
    });
});
