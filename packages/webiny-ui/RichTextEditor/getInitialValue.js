export default () => {
    return {
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
                                    text: "",
                                    marks: []
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    };
};
