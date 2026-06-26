import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ModelGroupDto } from "~/features/modelGroup/listModelGroups/abstractions.js";
import { normalizeIcon } from "~/utils/normalizeIcon.js";

const { Menu } = AdminConfig;

interface IGroupMenuProps {
    group: Pick<ModelGroupDto, "slug" | "name" | "icon">;
}
/**
 * Renders a menu item for a given content group.
 * Displays the group's name and icon in the menu.
 */
export const GroupMenu = ({ group }: IGroupMenuProps) => {
    const icon = normalizeIcon(group.icon);

    return (
        <Menu
            name={`cms/group/${group.slug}`}
            parent="headlessCMSContent"
            element={
                <Menu.Item
                    text={group.name}
                    icon={
                        icon ? (
                            <Menu.Item.Icon
                                label={group.name}
                                element={<FontAwesomeIcon icon={icon} />}
                            />
                        ) : null
                    }
                />
            }
        />
    );
};
