// @flow
import React from "react";
import { Menu } from "webiny-ui/Menu";
import { IconButton } from "webiny-ui/Button";
import { ReactComponent as MoreVerticalIcon } from "webiny-app-cms/editor/assets/icons/more_vert.svg";
import { getPlugins } from "webiny-plugins";
import { css } from "emotion";

const menuStyles = css({
    width: 220,
    right: -105,
    left: "auto !important",
    ".disabled": {
        opacity: 0.5,
        pointerEvents: "none"
    }
});

export default function FormOptionsMenu() {
    const plugins = getPlugins("form-editor-default-bar-right-form-options-option");
    if (!plugins.length) {
        return null;
    }

    return (
        <Menu className={menuStyles} handle={<IconButton icon={<MoreVerticalIcon />} />}>
            {plugins.map(pl => React.cloneElement(pl.render(), { key: pl.name }))}
        </Menu>
    );
}
