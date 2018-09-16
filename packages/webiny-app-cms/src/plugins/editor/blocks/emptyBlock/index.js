import { createBlock, createRow, createColumn } from "webiny-app-cms/editor/utils";

export default {
    name: "empty-block",
    type: "block",
    keywords: ["*"],
    create(options = {}) {
        return createBlock({
            ...options,
            elements: [
                createRow({
                    elements: [createColumn({ data: { width: 100 } })]
                })
            ]
        });
    }
};
