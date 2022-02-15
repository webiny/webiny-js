import React from "react";
import preview from "./preview.png";
import { createElement } from "../../../helpers";
import { PbEditorBlockPlugin, PbEditorElement } from "~/types";

const plugin: PbEditorBlockPlugin = {
    name: "pb-editor-block-empty",
    type: "pb-editor-block",
    category: "general",
    title: "Empty block",
    /**
     * Validate if this is at all possible? Types say it is not.
     * TODO @ts-refactor
     */
    // @ts-ignore
    create(options = {}, parent): PbEditorElement {
        return createElement("block", options, parent);
    },
    image: {
        meta: {
            width: 500,
            height: 73,
            aspectRatio: 500 / 73
        }
    },
    preview(): React.ReactElement {
        return <img src={preview} alt={"Empty block"} />;
    }
};
export default plugin;
