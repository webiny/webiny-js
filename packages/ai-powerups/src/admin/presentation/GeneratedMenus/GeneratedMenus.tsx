import React, { useEffect, useState } from "react";
import { useFeature } from "@webiny/app";
import { AdminConfig } from "@webiny/app-admin";
import { AdminComponentsFeature } from "~/admin/features/adminComponents/feature.js";
import type { AdminComponent } from "~/admin/features/adminComponents/abstractions.js";

const { Menu } = AdminConfig;

interface MenuConfig {
    name: string;
    label: string;
    to: string;
    parent: string | null;
    pinnable: boolean;
}

/*
 * A stored menu is JSON, and JSON that reached storage through a validated tool input. It is still
 * parsed defensively: a hand-edited CMS entry is the one path that bypasses that validation, and a
 * malformed one must not take the sidebar down with it. Anything that does not parse is skipped.
 */
const toMenuConfig = (component: AdminComponent): MenuConfig | null => {
    try {
        const parsed = JSON.parse(component.source) as Partial<MenuConfig>;

        if (!parsed.name || !parsed.label || !parsed.to) {
            return null;
        }

        return {
            name: parsed.name,
            label: parsed.label,
            to: parsed.to,
            parent: parsed.parent ?? null,
            pinnable: parsed.pinnable ?? true
        };
    } catch {
        return null;
    }
};

/**
 * Renders every stored sidebar item.
 *
 * Unlike a generated field renderer, nothing here is bundled or evaluated. A menu is configuration,
 * so this maps stored rows onto the same `AdminConfig.Menu` an extension would use, and the sidebar
 * cannot tell the difference between one of these and one written by hand.
 *
 * That is the argument for keeping config-shaped extensions out of the code path: no sandbox to
 * escape, no compile step to fail, and no contract about which components exist.
 */
export const GeneratedMenus = () => {
    const { gateway } = useFeature(AdminComponentsFeature);
    const [menus, setMenus] = useState<MenuConfig[]>([]);

    useEffect(() => {
        let cancelled = false;

        gateway
            .execute("menu")
            .then(result => {
                if (!cancelled) {
                    setMenus(result.map(toMenuConfig).filter((m): m is MenuConfig => m !== null));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setMenus([]);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [gateway]);

    if (menus.length === 0) {
        return null;
    }

    return (
        <AdminConfig>
            {menus.map(menu => (
                <Menu
                    key={menu.name}
                    name={menu.name}
                    parent={menu.parent}
                    element={<Menu.Link text={menu.label} to={menu.to} pinnable={menu.pinnable} />}
                />
            ))}
        </AdminConfig>
    );
};
