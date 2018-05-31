export default text => {
    return {
        document: {
            nodes: [
                {
                    object: "block",
                    type: "paragraph",
                    nodes: [
                        {
                            object: "text",
                            leaves: [
                                {
                                    text
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    };
};
