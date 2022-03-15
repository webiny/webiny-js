import React from "react";
import { Element as ElementType } from "~/types";
import { usePageElements } from "~/hooks/usePageElements";
import ErrorBoundary from "./ErrorBoundary";

export interface Props {
    element: ElementType;
}

export const Element: React.FC<Props> = props => {
    const { renderers } = usePageElements();

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
