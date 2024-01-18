export const createHeadingBlock = (blockText: string) => {
    return {
        type: "block",
        data: {},
        elements: [
            {
                type: "heading",
                data: {
                    text: {
                        desktop: {
                            type: "heading",
                            alignment: "left",
                            tag: "h1"
                        },
                        data: {
                            text: `{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"${blockText}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"heading-element","version":1,"tag":"h1","styles":[{"styleId":"heading1","type":"typography"}]}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}`
                        }
                    },
                    settings: {
                        margin: {
                            desktop: {
                                all: "0px"
                            }
                        },
                        padding: {
                            desktop: {
                                all: "0px"
                            }
                        }
                    }
                }
            }
        ]
    };
};
