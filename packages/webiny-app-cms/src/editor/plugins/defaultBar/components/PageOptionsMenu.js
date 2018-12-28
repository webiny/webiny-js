// @flow
import React from "react";
import { Menu } from "webiny-ui/Menu";
import { IconButton } from "webiny-ui/Button";
import { ReactComponent as MoreVerticalIcon } from "webiny-app-cms/editor/assets/icons/more_vert.svg";
import { getPlugins } from "webiny-plugins";

export default function PageOptionsMenu() {
    const plugins = getPlugins("cms-default-bar-right-page-options-option");
    return (
        <Menu handle={<IconButton icon={<MoreVerticalIcon />} />}>
            {plugins.map(pl => React.cloneElement(pl.render(), { key: pl.name }))}
        </Menu>
    );
}
