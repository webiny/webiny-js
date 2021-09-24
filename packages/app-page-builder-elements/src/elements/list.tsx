import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementComponent } from "~/types";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-list": any;
        }
    }
}

const defaultStyles = { display: "block" };

const List: ElementComponent = ({ element }) => {
    const { getStyles } = usePageElements();

    return (
        <pb-list
            class={getStyles({ element, styles: defaultStyles })}
            dangerouslySetInnerHTML={{ __html: element.data.text.data.text }}
        />
    );
};

export const createList = () => List;
