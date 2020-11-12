import React from "react";
import preview from "./preview.png";
import { createElementHelper } from "@webiny/app-page-builder/editor/helpers";
import { PbEditorBlockPlugin } from "@webiny/app-page-builder/types";

const width = 500;
const height = 73;

export default {
    name: "pb-editor-grid-block",
    type: "pb-editor-block",
    category: "general",
    title: "Grid block",
    create() {
        return createElementHelper("grid");
    },
    image: {
        meta: {
            width,
            height,
            aspectRatio: width / height
        }
    },
    preview() {
        return <img src={preview} alt={"Empty block"} />;
    }
} as PbEditorBlockPlugin;
