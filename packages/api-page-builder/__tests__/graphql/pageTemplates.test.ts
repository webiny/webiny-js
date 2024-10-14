import useGqlHandler from "./useGqlHandler";
import { simplePageTemplateContent } from "~tests/graphql/mocks/pageTemplates/simplePageTemplateContent";
import { simplePageBlockContent } from "~tests/graphql/mocks/pageTemplates/simplePageBlockContent";

jest.setTimeout(100000);

describe("Page Templates Test", () => {
    const {
        createPageTemplate,
        updatePageTemplate,
        updatePage,
        unlinkPageFromTemplate,
        createPageFromTemplate,
        createCategory,
        createBlockCategory,
        createPageBlock
    } = useGqlHandler();

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
                content: simplePageTemplateContent
            }
        });

        const pageCreatedFromTemplate = await createPageFromTemplate({
            category: "slug",
            templateId: pageTemplate.id,
            meta: {
                location: {
                    folderId: "root"
                }
            }
        }).then(([response]) => response.data.pageBuilder.createPageFromTemplate.data);

        // Update values of "Heading text" and "Paragraph text" variables. This how it's done in the page editor.
        await updatePage({
            id: pageCreatedFromTemplate.id,
            data: {
                content: {
                    id: "lk81y1na",
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
                                            value: '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"UPDATED-HEADING","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"heading-element","version":1,"tag":"h1","styles":[{"styleId":"heading1","type":"typography"}]}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}'
                                        },
                                        {
                                            id: "iwpP2qZAHy",
                                            type: "paragraph",
                                            label: "Paragraph text",
                                            value: '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"UPDATED-PARAGRAPH","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph-element","version":1,"styles":[{"styleId":"paragraph1","type":"typography"}]}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}'
                                        }
                                    ]
                                }
                            ]
                        }
                    },
                    elements: [],
                    path: []
                }
            }
        });

        // Unlinked page should no longer contain template variable-related data.
        const unlinkedPage = await unlinkPageFromTemplate({ id: pageCreatedFromTemplate.id }).then(
            ([response]) => response.data.pageBuilder.unlinkPageFromTemplate.data
        );

        expect(unlinkedPage.content).toMatchObject({
            id: "lk81y1na",
            type: "document",
            data: {},
            elements: [
                {
                    id: "yAOxZQgZsv",
                    type: "block",
                    data: {
                        variables: []
                    },
                    elements: [
                        {
                            elements: [
                                {
                                    elements: [
                                        {
                                            type: "heading",
                                            data: {
                                                text: {
                                                    data: {
                                                        text: '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"UPDATED-HEADING","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"heading-element","version":1,"tag":"h1","styles":[{"styleId":"heading1","type":"typography"}]}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}'
                                                    }
                                                },
                                                variableId: "aAUBVaa1fB"
                                            }
                                        },
                                        {
                                            type: "paragraph",
                                            data: {
                                                text: {
                                                    data: {
                                                        text: '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"UPDATED-PARAGRAPH","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph-element","version":1,"styles":[{"styleId":"paragraph1","type":"typography"}]}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}'
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        });
    });

    test("unlinking a page from a page template that contains a block should remove all template-related data", async () => {
        await createCategory({
            data: {
                slug: `slug`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        await createBlockCategory({
            data: {
                slug: `block-category`,
                name: `block-category-name`,
                icon: {
                    type: `emoji`,
                    name: `block-category-icon`,
                    value: `👍`
                },
                description: `block-category-description`
            }
        });

        const pageBlock = await createPageBlock({
            data: {
                name: "New block",
                blockCategory: "block-category",
                content: simplePageBlockContent
            }
        }).then(([response]) => response.data.pageBuilder.createPageBlock.data);

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

        // Add block to the page template.
        await updatePageTemplate({
            id: pageTemplate.id,
            data: {
                content: {
                    id: "lkb798zg",
                    type: "document",
                    data: {
                        template: {
                            variables: [
                                {
                                    blockId: "DABBrS43HC",
                                    variables: []
                                }
                            ]
                        }
                    },
                    elements: [
                        {
                            id: "DABBrS43HC",
                            type: "block",
                            data: {
                                templateBlockId: "DABBrS43HC",
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
                                variables: [],
                                blockId: pageBlock.id
                            },
                            elements: [],
                            path: ["lkb798zg"]
                        }
                    ],
                    path: []
                }
            }
        });

        const pageCreatedFromTemplate = await createPageFromTemplate({
            category: "slug",
            templateId: pageTemplate.id,
            meta: {
                location: {
                    folderId: "root"
                }
            }
        }).then(([response]) => response.data.pageBuilder.createPageFromTemplate.data);

        // Update values of "Heading text" and "Paragraph text" variables. This how it's done in the page editor.
        await updatePage({
            id: pageCreatedFromTemplate.id,
            data: {
                content: {
                    id: "lkb798zg",
                    type: "document",
                    data: {
                        template: {
                            variables: [
                                {
                                    blockId: "DABBrS43HC",
                                    variables: [
                                        {
                                            id: "FDEezrJ8NH",
                                            label: "Heading text",
                                            type: "heading",
                                            value: '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"UPDATED-HEADING","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"heading-element","version":1,"tag":"h1","styles":[{"styleId":"heading1","type":"typography"}]}],"direction":null,"format":"","indent":0,"type":"root","version":1}}'
                                        },
                                        {
                                            id: "SezNLOdXw3",
                                            label: "Paragraph text",
                                            type: "paragraph",
                                            value: '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"UPDATED-PARAGRAPH","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph-element","version":1,"styles":[{"styleId":"paragraph1","type":"typography"}]}],"direction":null,"format":"","indent":0,"type":"root","version":1}}'
                                        }
                                    ]
                                }
                            ],
                            slug: "test-template"
                        }
                    },
                    elements: [],
                    path: []
                }
            }
        });

        // Unlinked page should no longer contain template variable-related data.
        const unlinkedPage = await unlinkPageFromTemplate({ id: pageCreatedFromTemplate.id }).then(
            ([response]) => response.data.pageBuilder.unlinkPageFromTemplate.data
        );

        expect(unlinkedPage.content).toMatchObject({
            id: "lkb798zg",
            type: "document",
            data: {},
            elements: [
                {
                    data: {
                        variables: [
                            {
                                id: "FDEezrJ8NH",
                                type: "heading",
                                label: "Heading text",
                                value: '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"UPDATED-HEADING","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"heading-element","version":1,"tag":"h1","styles":[{"styleId":"heading1","type":"typography"}]}],"direction":null,"format":"","indent":0,"type":"root","version":1}}'
                            },
                            {
                                id: "SezNLOdXw3",
                                type: "paragraph",
                                label: "Paragraph text",
                                value: '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"UPDATED-PARAGRAPH","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph-element","version":1,"styles":[{"styleId":"paragraph1","type":"typography"}]}],"direction":null,"format":"","indent":0,"type":"root","version":1}}'
                            }
                        ],
                        blockId: pageBlock.id
                    },
                    elements: [
                        {
                            type: "grid",
                            elements: [
                                {
                                    type: "cell",
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
                                                        text: '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"UPDATED-HEADING","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"heading-element","version":1,"tag":"h1","styles":[{"styleId":"heading1","type":"typography"}]}],"direction":null,"format":"","indent":0,"type":"root","version":1}}'
                                                    }
                                                },
                                                variableId: "FDEezrJ8NH"
                                            }
                                        },
                                        {
                                            type: "paragraph",
                                            data: {
                                                text: {
                                                    desktop: {
                                                        type: "paragraph",
                                                        alignment: "left",
                                                        tag: "p"
                                                    },
                                                    data: {
                                                        text: '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"UPDATED-PARAGRAPH","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph-element","version":1,"styles":[{"styleId":"paragraph1","type":"typography"}]}],"direction":null,"format":"","indent":0,"type":"root","version":1}}'
                                                    }
                                                },
                                                variableId: "SezNLOdXw3"
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        });
    });
});
