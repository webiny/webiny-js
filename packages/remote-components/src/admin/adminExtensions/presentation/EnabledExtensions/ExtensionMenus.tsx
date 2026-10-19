import React from "react";
import { useFeature } from "@webiny/app";
import { AdminConfig } from "@webiny/app-admin";
import { createReactiveComponent } from "@webiny/app-admin";
import { ReactComponent as LinkIcon } from "@webiny/icons/link.svg";
import { EnabledExtensionsFeature } from "./feature.js";

const { Menu } = AdminConfig;

// Top-level items carry an icon, so a generated one lines up with the built-in items around it.
const topLevelIcon = (label: string) => <Menu.Link.Icon label={label} element={<LinkIcon />} />;

/**
 * Renders every enabled menu extension into the sidebar.
 *
 * Nothing is compiled or evaluated: a stored menu maps onto the same `AdminConfig.Menu` a hand-written
 * extension uses, so the sidebar cannot tell the two apart.
 */
export const ExtensionMenus = createReactiveComponent(function ExtensionMenus() {
    const { presenter } = useFeature(EnabledExtensionsFeature);

    const { menus } = presenter.vm;
    if (menus.length === 0) {
        return null;
    }

    return (
        <AdminConfig>
            {menus.map(menu => (
                <Menu
                    key={menu.name}
                    name={menu.name}
                    parent={menu.parent ?? undefined}
                    element={
                        <Menu.Link
                            text={menu.label}
                            to={menu.to}
                            pinnable={menu.pinnable}
                            icon={menu.parent ? undefined : topLevelIcon(menu.label)}
                        />
                    }
                />
            ))}
        </AdminConfig>
    );
});
