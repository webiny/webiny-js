import React from "react";
import preview from "./preview.png";
import { createElement } from "@webiny/app-page-builder/editor/helpers";
import { PbEditorBlockPlugin } from "@webiny/app-page-builder/types";

export default {
    name: "pb-editor-block-empty",
    type: "pb-editor-block",
    category: "general",
    title: "Empty block",
    create(options = {}, parent) {
        return createElement("block", options, parent);
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
