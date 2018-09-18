import { createElement, createBlock, createRow, createColumn } from "webiny-app-cms/editor/utils";

export default {
    name: "cms-block-1",
    type: "cms-block",
    keywords: ["text", "columns"],
    create() {
        return createBlock({
            elements: [
                createRow({
                    elements: [
                        createColumn({
                            data: { width: 100 },
                            elements: [
                                createElement("cms-element-text", {
                                    content: {
                                        typography: "h1",
                                        lipsum: {
                                            count: 4,
                                            units: "words"
                                        }
                                    }
                                })
                            ]
                        })
                    ]
                }),
                createRow({
                    elements: [
                        createColumn({
                            elements: [createElement("cms-element-text")],
                            data: { width: 33.33 }
                        }),
                        createColumn({
                            elements: [createElement("cms-element-text")],
                            data: { width: 33.33 }
                        }),
                        createColumn({
                            elements: [createElement("cms-element-text")],
                            data: { width: 33.33 }
                        })
                    ]
                })
            ]
        });
    }
};
