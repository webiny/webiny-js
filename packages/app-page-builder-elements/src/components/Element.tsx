import React from "react";
import { PageElement } from "~/types";
import { usePageElements } from "~/hooks/usePageElements";
import ErrorBoundary from "./ErrorBoundary";

export interface Props {
    element: PageElement;
}

const Element: React.FC<Props> = props => {
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

export const ElementChildren: React.FC<Props> = props => {
    return (
        <>
            {props.element.elements.map(element => (
                <Element key={element.id} element={element} />
            ))}
        </>
    );
};

export default Element;
