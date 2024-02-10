import React, { Fragment } from "react";
import { css } from "emotion";
import { makeComposable } from "@webiny/app-admin";
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
                {items.map((item, index) => (
                    <Fragment key={index}>{item}</Fragment>
                ))}
            </Menu>
        );
    }
);
