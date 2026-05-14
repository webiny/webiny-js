import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { DropdownMenu, IconButton } from "@webiny/admin-ui";

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
    "CmsModelsOptionsMenu",
    ({ items, ...props }: OptionsMenuProps) => {
        if (!items.length) {
            return null;
        }

        return (
            <DropdownMenu
                trigger={<IconButton icon={<MoreVerticalIcon />} size={"sm"} variant={"ghost"} />}
                {...props}
            >
                {items.map(item => (
                    <DropdownMenu.Item
                        key={item.label}
                        disabled={item.disabled ?? false}
                        onClick={item.onClick}
                        data-testid={item["data-testid"]}
                        icon={item.icon}
                        text={item.label}
                    />
                ))}
            </DropdownMenu>
        );
    }
);
