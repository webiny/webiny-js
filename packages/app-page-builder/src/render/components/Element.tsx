import React, { useMemo } from "react";

import { getPlugins } from "@webiny/plugins";
import { PbElement, PbRenderElementPlugin, PbThemePlugin } from "@webiny/app-page-builder/types";

export type ElementProps = {
    element: PbElement;
};

const Element = (props: ElementProps) => {
    const { element } = props;

    const theme = useMemo(
        () => Object.assign({}, ...getPlugins("pb-theme").map((pl: PbThemePlugin) => pl.theme)),
        []
    );

    if (!element) {
        return null;
    }

    const plugin = getPlugins<PbRenderElementPlugin>("pb-render-page-element").find(
        pl => pl.elementType === element.type
    ) as PbRenderElementPlugin;

    if (!plugin) {
        return null;
    }

    return <>{plugin.render({ theme, element })}</>;
};

export default Element;
