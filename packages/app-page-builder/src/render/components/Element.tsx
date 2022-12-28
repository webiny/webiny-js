import React, { useMemo } from "react";
import { plugins } from "@webiny/plugins";
import { PbElement, PbRenderElementPlugin, PbTheme, PbThemePlugin } from "~/types";
import { Element as PeElement } from "@webiny/app-page-builder-elements/components/Element";
import { Element as ElementType } from "@webiny/app-page-builder-elements/types";
import tryRenderingPlugin from "~/utils/tryRenderingPlugin";
import { isLegacyRenderingEngine } from "~/utils";

export interface ElementProps {
    element: PbElement | null;
}

const Element: React.FC<ElementProps> = props => {
    const { element } = props;

    // With the new engine, we can simply use the `PeElement` component
    // and the rest of the rendering will happen recursively.
    if (!isLegacyRenderingEngine) {
        return <PeElement element={element as ElementType} />;
    }

    const theme: PbTheme = useMemo(
        () => Object.assign({}, ...plugins.byType<PbThemePlugin>("pb-theme").map(pl => pl.theme)),
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

    const renderedPlugin = tryRenderingPlugin(() =>
        plugin.render({
            theme,
            element: element
        })
    );
    return <>{renderedPlugin}</>;
};

export default Element;
