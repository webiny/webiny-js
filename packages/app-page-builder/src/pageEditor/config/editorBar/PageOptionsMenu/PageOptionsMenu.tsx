import React from "react";
import { css } from "emotion";
import { makeComposable } from "@webiny/app-admin";
import { Menu, MenuItem } from "@webiny/ui/Menu";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as MoreVerticalIcon } from "~/admin/assets/more_vert.svg";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";

const menuStyles = css({
    ".disabled": {
        opacity: 0.5,
        pointerEvents: "none"
    }
});

export interface PageOptionsMenuItem {
    label: string;
    icon: React.ReactElement;
    onClick: () => void;
    disabled?: boolean;
    "data-testid"?: string;
}

export interface PageOptionsMenuProps {
    items: PageOptionsMenuItem[];
}

export const PageOptionsMenu = makeComposable<PageOptionsMenuProps>(
    "PageOptionsMenu",
    ({ items }) => {
        if (!items.length) {
            return null;
        }

        return (
            <Menu
                data-testid="pb-editor-page-options-menu"
                className={menuStyles}
                handle={<IconButton icon={<MoreVerticalIcon />} />}
            >
                {items.map(item => (
                    <MenuItem
                        key={item.label}
                        disabled={item.disabled ?? false}
                        onClick={item.onClick}
                        data-testid={item["data-testid"]}
                    >
                        <ListItemGraphic>
                            <Icon icon={item.icon} />
                        </ListItemGraphic>
                        {item.label}
                    </MenuItem>
                ))}
            </Menu>
        );
    }
);
