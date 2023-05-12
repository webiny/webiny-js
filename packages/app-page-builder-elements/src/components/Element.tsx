import React from "react";
import { Element as ElementType, RendererMeta } from "~/types";
import { usePageElements } from "~/hooks/usePageElements";
import ErrorBoundary from "./ErrorBoundary";

export interface Props {
    element: ElementType;
    meta?: RendererMeta;
}

export const Element: React.FC<Props> = props => {
    const { getRenderers } = usePageElements();

    const renderers = getRenderers();

    const { element } = props;
    if (!element) {
        return null;
    }

    const ElementRenderer = renderers ? renderers[element.type] : null;
    if (!ElementRenderer) {
        return null;
    }

    return (
        <ErrorBoundary>
            <ElementRenderer {...props} />
        </ErrorBoundary>
    );
};
