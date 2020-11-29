import React, { useEffect } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { plugins } from "@webiny/plugins";
import domToImage from "./domToImage";
import { PbElement } from "@webiny/app-page-builder/types";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";

const replaceContent = (element: PbElement, doc: Document): Document => {
    const pl = plugins
        .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
        .find(pl => pl.elementType === element.type);

    if (!pl) {
        return doc;
    }

    if (typeof pl.renderElementPreview === "function") {
        const elementNode: HTMLElement | null = document.getElementById(element.id);

        if (!elementNode) {
            return doc;
        }

        const newContentString = renderToStaticMarkup(
            pl.renderElementPreview({
                element,
                width: elementNode.offsetWidth || 0,
                height: elementNode.offsetHeight || 0
            })
        );

        const wrapper = document.createElement("div");
        wrapper.innerHTML = newContentString;

        const newContentDoc: ChildNode = wrapper.firstChild;

        doc.querySelector(`#${element.id}`).replaceWith(newContentDoc);
    }

    if (element.elements.length) {
        element.elements.forEach(el => {
            doc = replaceContent(el, doc);
        });
    }

    return doc;
};

const generateImage = async (
    element: PbElement,
    onChange: (value: string) => void
): Promise<void> => {
    const node = document.getElementById(element.id);
    if (!node) {
        return;
    }

    const editor = document.querySelector(".pb-editor");
    // Hide element highlight while creating the image
    editor.classList.add("pb-editor-no-highlight");

    const dataUrl = await domToImage.toPng(node, {
        onDocument: doc => replaceContent(element, doc),
        width: 1000
    });

    editor.classList.remove("pb-editor-no-highlight");

    onChange(dataUrl);
};

type ElementPreviewPropsType = {
    element: PbElement;
    onChange: (value: string) => void;
};
const ElementPreview: React.FunctionComponent<ElementPreviewPropsType> = ({
    element,
    onChange
}) => {
    useEffect(() => {
        generateImage(element, onChange);
    });

    return null;
};

export default ElementPreview;
