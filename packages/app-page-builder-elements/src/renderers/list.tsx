import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer } from "~/types";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-list": any;
        }
    }
}

const defaultStyles = { display: "block" };

const List: ElementRenderer = ({ element }) => {
    const { getClassNames, getElementClassNames, combineClassNames } = usePageElements();
    const classNames = combineClassNames(
        getClassNames(defaultStyles),
        getElementClassNames(element)
    );

    return (
        <pb-list
            class={classNames}
            dangerouslySetInnerHTML={{ __html: element.data.text.data.text }}
        />
    );
};

export const createList = () => List;
