import React from "react";
import preview from "./preview.png";
import { createElement } from "@webiny/app-page-builder/editor/utils";
import { PbEditorBlockPlugin } from "@webiny/app-page-builder/types";

export default {
    name: "pb-editor-grid-block",
    type: "pb-editor-block",
    category: "general",
    title: "Grid block",
    create(options = {}) {
        const { amount = 2, ...optionsRest } = options;
        return createElement("grid", {
            ...optionsRest,
            elements: Array(amount)
                .fill(0)
                .map(() => {
                    return createElement("cell", {});
                })
        });
    },
    image: {
        meta: {
            width: 500,
            height: 73,
            aspectRatio: 500 / 73
        }
    },
    preview() {
        return <img src={preview} alt={"Empty block"} />;
    }
} as PbEditorBlockPlugin;
