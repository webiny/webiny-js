import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer } from "~/types";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-quote": any;
        }
    }
}

const defaultStyles = { display: "block" };

const Quote: ElementRenderer = ({ element }) => {
    const { getClassNames, getElementClassNames, combineClassNames } = usePageElements();
    const classNames = combineClassNames(
        getClassNames(defaultStyles),
        getElementClassNames(element)
    );

    // It's how editor works, inserts blockquote / q tags.
    return (
        <pb-quote
            class={classNames}
            dangerouslySetInnerHTML={{ __html: element.data.text.data.text }}
        ></pb-quote>
    );
};

export const createQuote = () => Quote;
