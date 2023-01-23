import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer } from "~/types";
import { RenderLexicalContent } from "@webiny/lexical-editor";

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
    const { getClassNames, getElementClassNames, combineClassNames } = usePageElements();
    const classNames = combineClassNames(
        getClassNames(defaultStyles),
        getElementClassNames(element)
    );

    return (
        <RenderLexicalContent value={element.data.text.data.text || ""} />
    );
};

export const createParagraph = () => Paragraph;
