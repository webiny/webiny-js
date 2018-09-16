import cloneDeep from "lodash/cloneDeep";
import { createValue } from "webiny-app-cms/editor/components/Slate";

export default {
    name: "block-2",
    type: "block",
    keywords: ["image", "columns", "product"],
    create() {
        return cloneDeep({
            data: {},
            elements: [
                {
                    data: {},
                    elements: [
                        {
                            data: {
                                width: 100
                            },
                            elements: [
                                {
                                    data: {},
                                    elements: [],
                                    type: "image",
                                    settings: {}
                                }
                            ],
                            type: "column",
                            settings: {}
                        }
                    ],
                    type: "row",
                    settings: {}
                },
                {
                    data: {},
                    elements: [
                        {
                            data: {
                                width: 50
                            },
                            elements: [
                                {
                                    data: {
                                        text: createValue("Lorem ipsum.")
                                    },
                                    elements: [],
                                    type: "text",
                                    settings: {}
                                }
                            ],
                            type: "column",
                            settings: {}
                        },
                        {
                            data: {
                                width: 50
                            },
                            elements: [
                                {
                                    data: {
                                        text: createValue("Lorem ipsum.")
                                    },
                                    elements: [],
                                    type: "text",
                                    settings: {}
                                }
                            ],
                            type: "column",
                            settings: {}
                        }
                    ],
                    type: "row",
                    settings: {}
                }
            ],
            type: "block",
            settings: {}
        });
    }
};
