import React from "react";
import { Element as ElementType } from "~/types";
import { usePageElements } from "~/hooks/usePageElements";
import ErrorBoundary from "./ErrorBoundary";

export interface Props {
    element: ElementType;
}

export const Element: React.FC<Props> = props => {
    const { renderers, getElementStyles } = usePageElements();

    const { element } = props;
    if (!element) {
        return null;
    }

    const ElementRenderer = renderers[element.type];
    if (!ElementRenderer) {
        return null;
    }
    // Handle element visibility.
    const [styles] = getElementStyles(element);
    if (styles.visibility === "hidden") {
        return null;
    }

    return (
        <ErrorBoundary>
            <ElementRenderer {...props} />
        </ErrorBoundary>
    );
};
