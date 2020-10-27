import React from "react";
import {
    PbEditorPageElementPlugin,
    PbElement,
    PbShallowElement
} from "@webiny/app-page-builder/types";
import Cell from "./Cell";

const transformToShallowElement = (element: PbShallowElement | PbElement): PbShallowElement => {
    const isShallow = element.elements.some(child => typeof child === "string");
    if (isShallow || element.elements.length === 0) {
        return element as PbShallowElement;
    }
    return {
        ...element,
        elements: (element as PbElement).elements.map(child => child.id)
    };
};

const plugin: PbEditorPageElementPlugin = {
    type: "pb-editor-page-element",
    name: "pb-editor-page-element-cell",
    elementType: "cell",
    settings: [
        "pb-editor-page-element-settings-background",
        "pb-editor-page-element-settings-animation",
        "",
        "pb-editor-page-element-settings-border",
        "pb-editor-page-element-settings-shadow",
        "",
        "pb-editor-page-element-settings-padding",
        "pb-editor-page-element-settings-margin",
        ""
    ],
    canDelete: () => {
        return false;
    },
    create: options => {
        const size = options.data?.settings?.size;
        if (!size) {
            throw new Error("There must be a size of the cell when creating it.");
        }
        const r = {
            type: "cell",
            elements: [],
            data: {
                settings: {
                    margin: {
                        mobile: { top: 15, left: 15, right: 15, bottom: 15 },
                        desktop: { top: 25, left: 0, right: 0, bottom: 25 },
                        advanced: true
                    },
                    padding: {
                        mobile: { all: 10 },
                        desktop: { all: 0 }
                    },
                    size
                }
            }
        };
        console.log(r);
        return r;
    },
    render(props) {
        const { element } = props;
        return <Cell {...props} element={transformToShallowElement(element)} />;
    }
};

export default () => plugin;
