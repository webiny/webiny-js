import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer } from "~/types";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-paragraph": any;
        }
    }
}

const defaultStyles = { display: "block" };

const Paragraph: ElementRenderer = ({ element }) => {
    const { getCustomCss, getCss, css } = usePageElements();
    const classNames = css.cx(getCustomCss(defaultStyles), getCss(element));

    return (
        <pb-paragraph
            class={classNames}
            dangerouslySetInnerHTML={{ __html: element.data.text.data.text }}
        />
    );
};

export const createParagraph = () => Paragraph;
