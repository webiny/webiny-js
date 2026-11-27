import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { NavigationRenderer } from "@webiny/app-admin";
import { TenantSelector } from "@webiny/app-admin";
import { useAdminConfig } from "@webiny/app-admin";
import { SimpleLink } from "@webiny/app-admin";
import { Sidebar } from "@webiny/admin-ui";
import { SidebarMenuItems } from "./SidebarMenuItems.js";
import { TenantAvatar } from "../TenantAvatar.js";
import { useTenantSwitcher } from "../useTenantSwitcher.js";

export const Navigation = NavigationRenderer.createDecorator(() => {
    return createReactiveComponent(function Navigation() {
        const { menus, title } = useAdminConfig();
        const { current } = useTenantSwitcher().vm;

        // The current tenant's logo, so the collapsed rail still shows which tenant this is.
        let icon: React.ReactNode = null;
        if (current) {
            icon = (
                <SimpleLink to={"/"}>
                    <TenantAvatar tenant={current} />
                </SimpleLink>
            );
        }

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
