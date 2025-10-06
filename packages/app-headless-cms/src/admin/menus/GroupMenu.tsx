import React from "react";
import type { CmsGroup } from "~/types.js";
import { AdminConfig } from "@webiny/app-admin";
import { Icon } from "./Icon.js";

const { Menu } = AdminConfig;

/**
 * Renders a menu item for a given content group.
 * Displays the group's name and icon in the menu.
 */
export const GroupMenu = ({ group }: { group: CmsGroup }) => (
    <Menu
        name={group.id}
        parent="headlessCMSContent"
        element={
            <Menu.Item
                text={group.name}
                icon={<Menu.Link.Icon label="Content" element={<Icon group={group} />} />}
            />
        }
    />
);
