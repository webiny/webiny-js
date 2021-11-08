import React from "react";
import { Menu } from "@webiny/ui/Menu";
import { IconButton } from "@webiny/ui/Button";
import { plugins } from "@webiny/plugins";
import { css } from "emotion";
import { ReactComponent as MoreVerticalIcon } from "~/editor/assets/icons/more_vert.svg";
import { PbEditorDefaultBarRightPageOptionsPlugin } from "~/types";

const menuStyles = css({
    ".disabled": {
        opacity: 0.5,
        pointerEvents: "none"
    }
});

export default function PageOptionsMenu() {
    const pageOptionPlugins = plugins.byType<PbEditorDefaultBarRightPageOptionsPlugin>(
        "pb-editor-default-bar-right-page-options"
    );
    return (
        <Menu
            data-testid="pb-editor-page-options-menu"
            className={menuStyles}
            handle={<IconButton icon={<MoreVerticalIcon />} />}
        >
            {pageOptionPlugins.map(pl => React.cloneElement(pl.render(), { key: pl.name }))}
        </Menu>
    );
}
