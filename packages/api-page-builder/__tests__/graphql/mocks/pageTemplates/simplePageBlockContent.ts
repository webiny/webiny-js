import { PageElementId } from "~/graphql";

const blockId = PageElementId.create().getValue();

/**
 * Contains a grid > cell with a heading and a paragraph.
 * The heading and paragraph are both editable (linked elements).
 */
export const simplePageBlockContent = {
    id: blockId,
    type: "block",
    data: {
        settings: {
            width: {
                desktop: {
                    value: "100%"
                }
            },
            margin: {
                desktop: {
                    top: "0px",
                    right: "0px",
                    bottom: "0px",
                    left: "0px",
                    advanced: true
                }
            },
            padding: {
                desktop: {
                    all: "10px"
                }
            },
            horizontalAlignFlex: {
                desktop: "center"
            },
            verticalAlign: {
                desktop: "flex-start"
            }
        },
        variables: [
            {
                id: "FDEezrJ8NH",
                type: "heading",
                label: "Heading text",
                value: '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Heading","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"heading-element","version":1,"tag":"h1","styles":[{"styleId":"heading1","type":"typography"}]}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}'
            },
            {
                id: "SezNLOdXw3",
                type: "paragraph",
                label: "Paragraph text",
                value: '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat. Aenean faucibus nibh et justo cursus id rutrum lorem imperdiet. Nunc ut sem vitae risus tristique posuere.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph-element","version":1,"styles":[{"styleId":"paragraph1","type":"typography"}]}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}'
            }
        ]
    },
    elements: [
        {
            id: PageElementId.create().getValue(),
            type: "grid",
            data: {
                settings: {
                    width: {
                        desktop: {
                            value: "1100px"
                        }
                    },
                    margin: {
                        desktop: {
                            top: "0px",
                            right: "0px",
                            bottom: "0px",
                            left: "0px",
                            advanced: true
                        }
                    },
                    padding: {
                        desktop: {
                            all: "10px"
                        }
                    },
                    grid: {
                        cellsType: "12"
                    },
                    gridSettings: {
                        desktop: {
                            flexDirection: "row"
                        },
                        "mobile-landscape": {
                            flexDirection: "column"
                        }
                    },
                    horizontalAlignFlex: {
                        desktop: "flex-start"
                    },
                    verticalAlign: {
                        desktop: "flex-start"
                    }
                }
            },
            elements: [
                {
                    id: PageElementId.create().getValue(),
                    type: "cell",
                    data: {
                        settings: {
                            margin: {
                                desktop: {
                                    top: "0px",
                                    right: "0px",
                                    bottom: "0px",
                                    left: "0px",
                                    advanced: true
                                }
                            },
                            padding: {
                                desktop: {
                                    all: "0px"
                                }
                            },
                            grid: {
                                size: 12
                            }
                        }
                    },
                    elements: [
                        {
                            id: PageElementId.create().getValue(),
                            type: "heading",
                            data: {
                                text: {
                                    desktop: {
                                        type: "heading",
                                        alignment: "left",
                                        tag: "h1"
                                    },
                                    data: {
                                        text: '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Heading","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"heading-element","version":1,"tag":"h1","styles":[{"styleId":"heading1","type":"typography"}]}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}'
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
                                },
                                variableId: "FDEezrJ8NH"
                            },
                            elements: [],
                            path: ["UTaSFnVtkV", "uFzaV9SB6q", "k77Fdcod55", "BOMdKQBt23"]
                        },
                        {
                            id: PageElementId.create().getValue(),
                            type: "paragraph",
                            data: {
                                text: {
                                    desktop: {
                                        type: "paragraph",
                                        alignment: "left",
                                        tag: "p"
                                    },
                                    data: {
                                        text: '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat. Aenean faucibus nibh et justo cursus id rutrum lorem imperdiet. Nunc ut sem vitae risus tristique posuere.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph-element","version":1,"styles":[{"styleId":"paragraph1","type":"typography"}]}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}'
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
                                },
                                variableId: "SezNLOdXw3"
                            },
                            elements: [],
                            path: ["UTaSFnVtkV", "uFzaV9SB6q", "k77Fdcod55", "BOMdKQBt23"]
                        }
                    ],
                    path: ["UTaSFnVtkV", "uFzaV9SB6q", "k77Fdcod55"]
                }
            ],
            path: ["UTaSFnVtkV", "uFzaV9SB6q"]
        }
    ],
    path: ["UTaSFnVtkV"]
};
