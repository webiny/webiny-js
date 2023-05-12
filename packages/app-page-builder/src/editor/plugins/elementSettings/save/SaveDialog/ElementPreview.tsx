import React, { useEffect } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { plugins } from "@webiny/plugins";
import domToImage from "./domToImage";
import { PbEditorPageElementPlugin, PbElement } from "~/types";
import { isLegacyRenderingEngine } from "~/utils";

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

        const newContentDoc = wrapper.firstChild as ChildNode;
        // Element id must not start with a number.
        const validId = Number.isNaN(parseInt(element.id[0]));
        if (validId) {
            const docElement = doc.querySelector(`#${element.id}`);
            docElement && docElement.replaceWith(newContentDoc);
        } else {
            console.warn(`Element "id" must not start with a number.`);
        }
    }

    if (element.elements.length) {
        element.elements.forEach(el => {
            doc = replaceContent(el, doc);
        });
    }

    return doc;
};

const generateImage = async (element: any, onChange: (value: string) => void): Promise<void> => {
    const node = document.getElementById(element.id);
    if (!node) {
        return;
    }

    let dataUrl;
    if (isLegacyRenderingEngine) {
        const editor = document.querySelector(".pb-editor");
        // Hide element highlight while creating the image
        editor && editor.classList.add("pb-editor-no-highlight");

        dataUrl = await domToImage.toPng(node, {
            onDocument: (doc: Document) => replaceContent(element, doc),
            width: 1000
        });

        editor && editor.classList.remove("pb-editor-no-highlight");
    } else {
        dataUrl = await domToImage.toPng(node, {
            width: 2000,
            filter: (element: Element) => {
                return element.tagName !== "PB-ELEMENT-CONTROLS-OVERLAY";
            }
        });
    }

    onChange(dataUrl);
};

type ElementPreviewPropsType = {
    element: any;
    onChange: (value: string) => void;
};
const ElementPreview: React.FC<ElementPreviewPropsType> = ({ element, onChange }) => {
    useEffect(() => {
        generateImage(element, onChange);
    });

    return null;
};

export default ElementPreview;
