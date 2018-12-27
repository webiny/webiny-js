// @flow
import * as React from "react";
import { createBlock, createRow, createColumn } from "webiny-app-cms/editor/utils";
import preview from "./preview.png";

export default {
    name: "cms-block-empty",
    type: "cms-block",
    category: "cms-block-category-general",
    title: "Empty block",
    create(options: Object = {}) {
        return createBlock({
            ...options,
            elements: [
                createRow({
                    elements: [createColumn({ data: { width: 100 } })]
                })
            ]
        });
    },
    preview() {
        return <img src={preview} alt={"Empty block"} />;
    }
};
