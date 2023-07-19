import useGqlHandler from "./useGqlHandler";

jest.setTimeout(100000);

describe("Page Templates Test", () => {
    const { createPageTemplate, updatePageTemplate, getPage, unlinkPageFromTemplate, createPageFromTemplate, createCategory } = useGqlHandler();

    test("unlinking a page from a page template should remove all template-related data", async () => {
        await createCategory({
            data: {
                slug: `slug`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });


        const pageTemplate = await createPageTemplate({
            data: {
                title: "test-template",
                slug: "test-template",
                description: "test",
                tags: [],
                layout: "static",
                pageCategory: "slug"
            }
        }).then(([response]) => response.data.pageBuilder.createPageTemplate.data);

        await updatePageTemplate({
            id: pageTemplate.id,
            data: {
                content: {
                    id: "lk860n5p",
                    type: "document",
                    data: {
                        template: {
                            variables: [
                                {
                                    blockId: "yAOxZQgZsv",
                                    variables: [
                                        {
                                            id: "aAUBVaa1fB",
                                            type: "heading",
                                            label: "Heading text",
                                            value: '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Heading","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"heading-element","version":1,"tag":"h1","styles":[{"styleId":"heading1","type":"typography"}]}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}'
                                        },
                                        {
                                            id: "iwpP2qZAHy",
                                            type: "paragraph",
                                            label: "Paragraph text",
                                            value: '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat. Aenean faucibus nibh et justo cursus id rutrum lorem imperdiet. Nunc ut sem vitae risus tristique posuere.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph-element","version":1,"styles":[{"styleId":"paragraph1","type":"typography"}]}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}'
                                        }
                                    ]
                                }
                            ]
                        }
                    },
                    elements: [
                        {
                            id: "yAOxZQgZsv",
                            type: "block",
                            data: {
                                templateBlockId: "yAOxZQgZsv",
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
                                        id: "aAUBVaa1fB",
                                        type: "heading",
                                        label: "Heading text",
                                        value: '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Heading","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"heading-element","version":1,"tag":"h1","styles":[{"styleId":"heading1","type":"typography"}]}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}'
                                    },
                                    {
                                        id: "iwpP2qZAHy",
                                        type: "paragraph",
                                        label: "Paragraph text",
                                        value: '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat. Aenean faucibus nibh et justo cursus id rutrum lorem imperdiet. Nunc ut sem vitae risus tristique posuere.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph-element","version":1,"styles":[{"styleId":"paragraph1","type":"typography"}]}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}'
                                    }
                                ]
                            },
                            elements: [
                                {
                                    id: "luzsb731h5",
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
                                            id: "c1KzABC9LJ",
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
                                                    },
                                                    horizontalAlignFlex: {
                                                        desktop: "flex-start"
                                                    }
                                                }
                                            },
                                            elements: [
                                                {
                                                    id: "aAUBVaa1fB",
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
                                                        variableId: "aAUBVaa1fB"
                                                    },
                                                    elements: [],
                                                    path: [
                                                        "lk860n5p",
                                                        "yAOxZQgZsv",
                                                        "luzsb731h5",
                                                        "c1KzABC9LJ"
                                                    ]
                                                },
                                                {
                                                    id: "iwpP2qZAHy",
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
                                                        variableId: "iwpP2qZAHy"
                                                    },
                                                    elements: [],
                                                    path: [
                                                        "lk860n5p",
                                                        "yAOxZQgZsv",
                                                        "luzsb731h5",
                                                        "c1KzABC9LJ"
                                                    ]
                                                }
                                            ],
                                            path: ["lk860n5p", "yAOxZQgZsv", "luzsb731h5"]
                                        }
                                    ],
                                    path: ["lk860n5p", "yAOxZQgZsv"]
                                }
                            ],
                            path: ["lk860n5p"]
                        }
                    ],
                    path: []
                }
            }
        });


        const pageCreatedFromTemplate = await createPageFromTemplate({
            "category": "slug",
            "templateId": pageTemplate.id,
            "meta": {
                "location": {
                    "folderId": "root"
                }
            }
        }).then(([response]) => response.data.pageBuilder.createPageFromTemplate.data);

        const gotPage = await getPage({id: pageCreatedFromTemplate.id})

        const [tpl] = await unlinkPageFromTemplate({id: pageCreatedFromTemplate.id})


        const aa = 123;
    });
});
