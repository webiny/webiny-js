import React from "react";
import preview from "./preview.png";
import { createElement } from "../../../helpers";
import { PbEditorBlockPlugin, PbEditorElement } from "~/types";

const width = 500;
const height = 73;
const aspectRatio = width / height;

const plugin: PbEditorBlockPlugin = {
    name: "pb-editor-grid-block",
    type: "pb-editor-block",
    category: "general",
    title: "Grid block",
    create(): PbEditorElement {
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
    tags: [],
    preview(): React.ReactElement {
        return <img src={preview} alt={"Empty grid block"} />;
    }
};
export default plugin;
