// @flow
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getPlugin } from "webiny-plugins";
import domToImage from "./domToImage";

export default class ElementPreview extends React.Component<*> {
    componentDidMount() {
        this.generateImage();
    }

    componentDidUpdate() {
        this.generateImage();
    }

    replaceContent(element: Object, doc: Document) {
        const pl = getPlugin(element.type);
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

            // $FlowFixMe
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

        const editor = document.querySelector(".cms-editor");
        // Hide element highlight while creating the image
        // $FlowFixMe
        editor.classList.add("cms-editor-no-highlight");

        const dataUrl = await domToImage.toPng(node, {
            onDocument: doc => this.replaceContent(element, doc),
            width: 1000
        });

        // $FlowFixMe
        editor.classList.remove("cms-editor-no-highlight");

        this.props.onChange(dataUrl);
    }

    render() {
        return null;
    }
}
