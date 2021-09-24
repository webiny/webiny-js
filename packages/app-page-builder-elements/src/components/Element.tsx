import React from "react";
import { Element as ElementType } from "~/types";
import { usePageElements } from "~/hooks/usePageElements";
import ErrorBoundary from "./ErrorBoundary";

export interface Props {
    element: ElementType;
}

export const Element: React.FC<Props> = props => {
    const { element } = props;
    const { elements } = usePageElements();

    if (!element) {
        return null;
    }

    const PageElementComponent = elements[element.type];
    if (!PageElementComponent) {
        return null;
    }

    return (
        <ErrorBoundary>
            <PageElementComponent {...props} />
        </ErrorBoundary>
    );
};
