import React, { useMemo } from "react";

import { plugins } from "@webiny/plugins";
import { PbElement, PbRenderElementPlugin, PbThemePlugin } from "../../types";

import tryRenderingPlugin from "./../../utils/tryRenderingPlugin";

export type ElementProps = {
    element: PbElement;
};

const Element = (props: ElementProps) => {
    const { element } = props;

    const theme = useMemo(
        () => Object.assign({}, ...plugins.byType("pb-theme").map((pl: PbThemePlugin) => pl.theme)),
        []
    );

    if (!element) {
        return null;
    }

    const plugin = plugins
        .byType<PbRenderElementPlugin>("pb-render-page-element")
        .find(pl => pl.elementType === element.type);

    if (!plugin) {
        return null;
    }

    const renderedPlugin = tryRenderingPlugin(() => plugin.render({ theme, element }));

    return <>{renderedPlugin}</>;
};

export default Element;
