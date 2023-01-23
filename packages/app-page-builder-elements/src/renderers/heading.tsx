import React, {useEffect, useState} from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer } from "~/types";
import { editorStateJSONStringToHtml } from "@webiny/lexical-editor";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-heading": any;
        }
    }
}

const defaultStyles = {
    display: "block"
};

const Heading: ElementRenderer = ({ element }) => {
    const { getClassNames, getElementClassNames, combineClassNames } = usePageElements();
    const tag = element.data.text.desktop.tag || "h1";
    const [elementHtml, setElementHtml] = useState("");

    const classNames = combineClassNames(
        getClassNames(defaultStyles),
        getElementClassNames(element)
    );

    useEffect(() => {
        editorStateJSONStringToHtml(element.data.text.data.text || "", (html) => {
            setElementHtml(html);
        });
    }, []);

    return (
        <pb-heading>
            <RenderLexicalContent value={element.data.text.data.text || ""} />
        </pb-heading>
    );
};

export const createHeading = () => Heading;
