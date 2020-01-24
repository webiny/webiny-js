import * as React from "react";
import { createBlock, createRow, createColumn } from "@webiny/app-page-builder/editor/utils";
import preview from "./preview.png";
import { PbEditorBlockPlugin } from "@webiny/app-page-builder/admin/types";

export default {
    name: "pb-editor-block-empty",
    type: "pb-editor-block",
    category: "general",
    title: "Empty block",
    create(options = {}) {
        return createBlock({
            ...options,
            elements: [
                createRow({
                    elements: [createColumn({ data: { width: 100 } })]
                })
            ]
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
