import React, { useMemo } from "react";
import { plugins } from "@webiny/plugins";
import { PbElement, PbRenderElementPlugin, PbTheme, PbThemePlugin } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import { Element as PeElement } from "@webiny/app-page-builder-elements/components/Element";
import tryRenderingPlugin from "~/utils/tryRenderingPlugin";

export interface ElementProps {
    element: PbElement | null;
}

const Element: React.FC<ElementProps> = props => {
    const { element } = props;

    const theme: PbTheme = useMemo(
        () => Object.assign({}, ...plugins.byType<PbThemePlugin>("pb-theme").map(pl => pl.theme)),
        []
    );

    if (!element) {
        return null;
    }

    const pageElements = usePageElements();
    if (pageElements) {
        /**
         * TODO @ts-refactor
         * Write better types for PbElement and PeElement
         */
        // @ts-ignore
        return <PeElement element={element} />;
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
