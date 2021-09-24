import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementComponent } from "~/types";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-paragraph": any;
        }
    }
}

const defaultStyles = { display: "block" };

const Paragraph: ElementComponent = ({ element }) => {
    const { getStyles } = usePageElements();

    return (
        <pb-paragraph
            class={getStyles({ element, styles: defaultStyles })}
            dangerouslySetInnerHTML={{ __html: element.data.text.data.text }}
        />
    );
};

export const createParagraph = () => Paragraph;
