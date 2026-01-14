import React from "react";
import type { CmsGroup } from "~/types.js";
import { AdminConfig } from "@webiny/app-admin";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";

const { Menu } = AdminConfig;

/**
 * Renders a menu item for a given content group.
 * Displays the group's name and icon in the menu.
 */
export const GroupMenu = ({ group }: { group: CmsGroup }) => {
    const icon = (group.icon || "").split("/") as IconProp;

    return (
        <Menu
            name={group.id}
            parent="headlessCMSContent"
            element={
                <Menu.Item
                    text={group.name}
                    icon={
                        <Menu.Item.Icon
                            label={group.name}
                            element={<FontAwesomeIcon icon={icon} />}
                        />
                    }
                />
            }
        />
    );
};
