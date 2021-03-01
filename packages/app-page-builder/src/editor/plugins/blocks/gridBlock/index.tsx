import React from "react";
import preview from "./preview.png";
import { createElement } from "../../../helpers";
import { PbEditorBlockPlugin } from "../../../../types";

const width = 500;
const height = 73;
const aspectRatio = width / height;

export default {
    name: "pb-editor-grid-block",
    type: "pb-editor-block",
    category: "general",
    title: "Grid block",
    create() {
        return createElement("block", {
            elements: [createElement("grid")]
        });
    },
    image: {
        meta: {
            width,
            height,
            aspectRatio
        }
    },
    preview() {
        return <img src={preview} alt={"Empty grid block"} />;
    }
} as PbEditorBlockPlugin;
