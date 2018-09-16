import { createElement, createBlock, createRow, createColumn } from "webiny-app-cms/editor/utils";

export default {
    name: "block-1",
    type: "block",
    keywords: ["text", "columns"],
    create() {
        return createBlock({
            elements: [
                createRow({
                    elements: [
                        createColumn({
                            data: { width: 100 },
                            elements: [
                                createElement("text", {
                                    content: {
                                        typography: "headline1",
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
                            elements: [createElement("text")],
                            data: { width: 33.33 }
                        }),
                        createColumn({
                            elements: [createElement("text")],
                            data: { width: 33.33 }
                        }),
                        createColumn({
                            elements: [createElement("text")],
                            data: { width: 33.33 }
                        })
                    ]
                })
            ]
        });
    }
};
