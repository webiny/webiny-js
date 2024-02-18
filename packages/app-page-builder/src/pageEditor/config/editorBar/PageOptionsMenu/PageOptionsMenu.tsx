import React, { Fragment } from "react";
import { css } from "emotion";
import { makeDecoratable } from "@webiny/app-admin";
import { Menu } from "@webiny/ui/Menu";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as MoreVerticalIcon } from "~/admin/assets/more_vert.svg";

const menuStyles = css({
    ".disabled": {
        opacity: 0.5,
        pointerEvents: "none"
    }
});

export interface PageOptionsMenuProps {
    items: JSX.Element[];
}

export const PageOptionsMenu = makeDecoratable(
    "PageOptionsMenu",
    ({ items }: PageOptionsMenuProps) => {
        if (!items.length) {
            return null;
        }

        return (
            <Menu
                data-testid="pb-editor-page-options-menu"
                className={menuStyles}
                handle={<IconButton icon={<MoreVerticalIcon />} />}
            >
                {items.map((item, index) => (
                    <Fragment key={index}>{item}</Fragment>
                ))}
            </Menu>
        );
    }
);
