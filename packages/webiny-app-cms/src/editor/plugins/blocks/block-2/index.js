import cloneDeep from "lodash/cloneDeep";
import { createValue } from "webiny-app-cms/editor/components/Slate";

export default {
    name: "cms-block-2",
    type: "cms-block",
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
                                    type: "cms-element-image",
                                    settings: {}
                                }
                            ],
                            type: "cms-element-column",
                            settings: {}
                        }
                    ],
                    type: "cms-element-row",
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
                                    type: "cms-element-text",
                                    settings: {}
                                }
                            ],
                            type: "cms-element-column",
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
                                    type: "cms-element-text",
                                    settings: {}
                                }
                            ],
                            type: "cms-element-column",
                            settings: {}
                        }
                    ],
                    type: "cms-element-row",
                    settings: {}
                }
            ],
            type: "cms-element-block",
            settings: {}
        });
    }
};
