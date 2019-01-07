// @flow
export default {
    id: "5c23d54346e6da84c34ce9c2",
    createdOn: "2018-12-26 19:23:47",
    savedOn: "2018-12-26 19:23:47",
    updatedOn: null,
    deleted: 0,
    name: "Test1",
    type: "block",
    content: {
        data: {},
        settings: {},
        elements: [
            {
                data: {},
                settings: { style: { margin: { all: 15 }, padding: { all: 15 } } },
                elements: [
                    {
                        data: { width: 50 },
                        settings: { style: { margin: "20px" } },
                        elements: [
                            {
                                data: {
                                    text: {
                                        object: "value",
                                        document: {
                                            object: "document",
                                            nodes: [
                                                {
                                                    object: "block",
                                                    type: "paragraph",
                                                    nodes: [
                                                        {
                                                            object: "text",
                                                            leaves: [
                                                                {
                                                                    object: "leaf",
                                                                    text:
                                                                        "Occaecat deserunt non sint duis labore dolor anim cupidatat nostrud ipsum eiusmod. Elit elit eiusmod est et proident. Excepteur qui non veniam consectetur quis elit veniam esse dolor nisi aute magna."
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    }
                                },
                                settings: { style: { padding: { all: 20 } } },
                                elements: [],
                                type: "cms-element-text"
                            }
                        ],
                        type: "cms-element-column"
                    },
                    {
                        data: { width: 50 },
                        settings: { style: { margin: "20px" } },
                        elements: [
                            {
                                data: {
                                    name: "test1BlockImage.png",
                                    type: "image/png",
                                    size: 74516,
                                    src: "/files/test1BlockImage.png",
                                    meta: {
                                        width: 1200,
                                        height: 1200,
                                        aspectRatio: 1
                                    }
                                },
                                settings: {},
                                elements: [],
                                type: "cms-element-image"
                            }
                        ],
                        type: "cms-element-column"
                    }
                ],
                type: "cms-element-row"
            }
        ],
        type: "cms-element-block"
    },
    preview: {
        name: "test1BlockImagePreview.png",
        size: 18405,
        src: "/files/test1BlockImagePreview.png",
        type: "image/png",
        meta: {
            width: 500,
            height: 263,
            aspectRatio: 1.9
        }
    },
    keywords: null,
    category: "cms-block-category-general"
};
