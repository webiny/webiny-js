import React from "react";
import { createElement } from "~/editor/helpers";
import { PbEditorBlockPlugin, PbEditorElement } from "~/types";
import preview from "~/admin/views/PageBlocks/assets/preview.png";

const width = 1000;
const height = 117;
const aspectRatio = width / height;

const plugin: PbEditorBlockPlugin = {
    name: "pb-editor-block-empty",
    type: "pb-editor-block",
    blockCategory: "general",
    title: "Empty block",
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
