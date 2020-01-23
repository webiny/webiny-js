import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getPlugins } from "@webiny/plugins";
import domToImage from "./domToImage";
import { PbElement } from "@webiny/app-page-builder/types";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/admin/types";

export default class ElementPreview extends React.Component<any> {
    componentDidMount() {
        this.generateImage();
    }

    componentDidUpdate() {
        this.generateImage();
    }

    replaceContent(element: PbElement, doc: Document) {
        const pl = getPlugins<PbEditorPageElementPlugin>("pb-editor-page-element").find(
            pl => pl.elementType === element.type
        );

        if (!pl) {
            return doc;
        }

        if (typeof pl.renderElementPreview === "function") {
            const elementNode: any = document.getElementById(element.id);

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

            const newContentDoc: any = wrapper.firstChild;

            doc.querySelector("#" + element.id).replaceWith(newContentDoc);
        }

        if (element.elements.length) {
            element.elements.forEach(el => {
                doc = this.replaceContent(el, doc);
            });
        }

        return doc;
    }

    async generateImage() {
        const { element } = this.props;
        const node = document.getElementById(element.id);
        if (!node) {
            return null;
        }

        const editor = document.querySelector(".pb-editor");
        // Hide element highlight while creating the image
        editor.classList.add("pb-editor-no-highlight");

        const dataUrl = await domToImage.toPng(node, {
            onDocument: doc => this.replaceContent(element, doc),
            width: 1000
        });

        editor.classList.remove("pb-editor-no-highlight");

        this.props.onChange(dataUrl);
    }

    render() {
        return null;
    }
}
