import { createElement } from "@webiny/app-page-builder/editor/utils";
import React from "react";
import { Grid } from "./Grid";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";

const gridPlugin: PbEditorPageElementPlugin = {
    type: "pb-editor-page-element",
    name: "pb-editor-page-element-grid",
    elementType: "grid",
    settings: [
        "pb-editor-page-element-settings-cells",
        "",
        "pb-editor-page-element-settings-clone",
        "pb-editor-page-element-settings-delete"
    ],
    canDelete: () => {
        return true;
    },
    create: options => {
        const { amount = 2, ...optionsRest } = options;
        return {
            type: "grid",
            elements: Array(amount)
                .fill(0)
                .map(() => {
                    return createElement("cell", {});
                }),
            data: {
                settings: {
                    width: { value: "100%" },
                    margin: {
                        mobile: { top: 15, left: 15, right: 15, bottom: 15 },
                        desktop: { top: 25, left: 0, right: 0, bottom: 25 },
                        advanced: true
                    },
                    padding: {
                        mobile: { all: 10 },
                        desktop: { all: 0 }
                    }
                }
            },
            ...optionsRest
        };
    },
    render({ element }) {
        return <Grid element={element} />;
    }
};

const cellPlugin: PbEditorPageElementPlugin = {
    type: "pb-editor-page-element",
    name: "pb-editor-page-element-cell",
    elementType: "cell",
    settings: ["pb-editor-page-element-settings-clone", "pb-editor-page-element-settings-delete"],
    canDelete: () => {
        return false;
    },
    create: options => {
        const { width = "auto" } = options || {};
        return {
            type: "cell",
            elements: [],
            data: {
                settings: {
                    width: { value: width },
                    margin: {
                        mobile: { top: 15, left: 15, right: 15, bottom: 15 },
                        desktop: { top: 25, left: 0, right: 0, bottom: 25 },
                        advanced: true
                    },
                    padding: {
                        mobile: { all: 10 },
                        desktop: { all: 0 }
                    }
                }
            }
        };
    },
    render({ element }) {
        return <div>{JSON.stringify(element)}</div>;
    }
};

const plugin = (): PbEditorPageElementPlugin[] => {
    return [gridPlugin, cellPlugin];
};

export default plugin;
