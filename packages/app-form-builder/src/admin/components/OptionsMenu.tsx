import React from "react";
import { css } from "emotion";
import { makeDecoratable } from "@webiny/app-admin";
import { Menu, MenuItem } from "@webiny/ui/Menu";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as MoreVerticalIcon } from "@material-design-icons/svg/filled/more_vert.svg";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";

const menuStyles = css({
    ".disabled": {
        opacity: 0.5,
        pointerEvents: "none"
    }
});

export interface OptionsMenuItem {
    label: string;
    icon: React.ReactElement;
    onClick: () => void;
    disabled?: boolean;
    "data-testid"?: string;
}

export interface OptionsMenuProps {
    items: OptionsMenuItem[];
    "data-testid"?: string;
}

export const OptionsMenu = makeDecoratable(
    "OptionsMenu",
    ({ items, ...props }: OptionsMenuProps) => {
        if (!items.length) {
            return null;
        }

        return (
            <Menu
                className={menuStyles}
                handle={<IconButton icon={<MoreVerticalIcon />} />}
                anchor={"topLeft"}
                {...props}
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
