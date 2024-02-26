import { pageModel } from "./mocks/pageWithDynamicZonesModel";
import { setupGroupAndModels } from "../testHelpers/setup";
import { usePageManageHandler } from "../testHelpers/usePageManageHandler";
import { usePageReadHandler } from "../testHelpers/usePageReadHandler";
import { useAuthorManageHandler } from "~tests/testHelpers/useAuthorManageHandler";
import { CmsModel } from "~tests/types";

const singularPageApiName = pageModel.singularApiName;

const withTemplateId = (data: Record<string, any>) => {
    return {
        ...data,
        content: data.content.map((obj: any) => ({ ...obj, _templateId: expect.any(String) }))
    };
};

const contentEntryQueryData = {
    content: [
        {
            text: "Simple Text #1",
            __typename: `${singularPageApiName}_Content_SimpleText`
        },
        {
            title: "Hero Title #1",
            __typename: `${singularPageApiName}_Content_Hero`
        },
        {
            title: "Hero Title #2",
            __typename: `${singularPageApiName}_Content_Hero`
        },
        {
            __typename: `${singularPageApiName}_Content_Objecting`,
            nestedObject: {
                __typename: `${singularPageApiName}_Content_Objecting_NestedObject`,
                objectNestedObject: [
                    {
                        nestedObjectNestedTitle: "Content Objecting nested title #1"
                    },
                    {
                        nestedObjectNestedTitle: "Content Objecting nested title #2"
                    }
                ],
                objectTitle: "Objective title #1"
            },
            dynamicZone: {
                __typename: `${singularPageApiName}_Content_Objecting_DynamicZone_SuperNestedObject`,
                authors: [
                    {
                        modelId: "author",
                        id: "john-doe#0001"
                    }
                ]
            }
        },
        {
            __typename: `${singularPageApiName}_Content_Author`,
            author: {
                modelId: "author",
                id: "john-doe#0001"
            },
            authors: [
                {
                    modelId: "author",
                    id: "john-doe#0001"
                }
            ]
        }
    ],
    header: {
        title: "Header #1",
        image: "https://d3bwcib4j08r73.cloudfront.net/files/webiny-serverless-cms.png",
        __typename: `${singularPageApiName}_Header_ImageHeader`
    },
    objective: {
        nestedObject: {
            objectNestedObject: [
                {
                    nestedObjectNestedTitle: "Objective nested title #1"
                },
                {
                    nestedObjectNestedTitle: "Objective nested title #2"
                }
            ],
            objectTitle: "Objective title #1",
            objectBody: [
                {
                    tag: "h1",
                    content: "Rich Text"
                },
                {
                    tag: "div",
                    children: [
                        {
                            tag: "p",
                            content: "Testing the rich text storage"
                        }
                    ]
                }
            ]
        },
        __typename: `${singularPageApiName}_Objective_Objecting`
    },
    reference: {
        author: {
            id: "john-doe#0001",
            modelId: "author",
            __typename: "RefField"
        },
        __typename: `${singularPageApiName}_Reference_Author`
    },
    references1: {
        authors: [
            {
                id: "john-doe#0001",
                modelId: "author",
                __typename: "RefField"
            }
        ],
        __typename: `${singularPageApiName}_References1_Authors`
    },
    references2: [
        {
            author: {
                id: "john-doe#0001",
                modelId: "author",
                __typename: "RefField"
            },
            __typename: `${singularPageApiName}_References2_Author`
        }
    ]
};

const contentEntryMutationData = {
    content: [
        {
            SimpleText: { text: "Simple Text #1" }
        },
        {
            Hero: { title: "Hero Title #1" }
        },
        {
            Hero: { title: "Hero Title #2" }
        },
        {
            Objecting: {
                nestedObject: {
                    objectTitle: "Objective title #1",
                    objectNestedObject: [
                        {
                            nestedObjectNestedTitle: "Content Objecting nested title #1"
                        },
                        {
                            nestedObjectNestedTitle: "Content Objecting nested title #2"
                        }
                    ]
                },
                dynamicZone: {
                    SuperNestedObject: {
                        authors: [
                            {
                                modelId: "author",
                                id: "john-doe#0001"
                            }
                        ]
                    }
                }
            }
        },
        {
            Author: {
                author: {
                    modelId: "author",
                    id: "john-doe#0001"
                },
                authors: [
                    {
                        modelId: "author",
                        id: "john-doe#0001"
                    }
                ]
            }
        }
    ],
    header: {
        ImageHeader: {
            title: "Header #1",
            image: "https://d3bwcib4j08r73.cloudfront.net/files/webiny-serverless-cms.png"
        }
    },
    objective: {
        Objecting: {
            nestedObject: {
                objectTitle: "Objective title #1",
                objectBody: [
                    {
                        tag: "h1",
                        content: "Rich Text"
                    },
                    {
                        tag: "div",
                        children: [
                            {
                                tag: "p",
                                content: "Testing the rich text storage"
                            }
                        ]
                    }
                ],
                objectNestedObject: [
                    {
                        nestedObjectNestedTitle: "Objective nested title #1"
                    },
                    {
                        nestedObjectNestedTitle: "Objective nested title #2"
                    }
                ]
            }
        }
    },
    reference: {
        Author: {
            author: {
                id: "john-doe#0001",
                modelId: "author"
            }
        }
    },
    references1: {
        Authors: {
            authors: [
                {
                    id: "john-doe#0001",
                    modelId: "author"
                }
            ]
        }
    },
    references2: [
        {
            Author: {
                author: {
                    id: "john-doe#0001",
                    modelId: "author"
                }
            }
        }
    ]
};

interface SetupAuthorParams {
    manager: ReturnType<typeof useAuthorManageHandler>;
}

const setupAuthor = async ({ manager }: SetupAuthorParams) => {
    const [authorResponse] = await manager.createAuthor({
        data: {
            id: "john-doe",
            fullName: "John Doe"
        }
    });

    const [authorPublishResponse] = await manager.publishAuthor({
        revision: authorResponse.data.createAuthor.data.id
    });

    return authorPublishResponse.data.publishAuthor.data;
};

describe("dynamicZone field", () => {
    const manageOpts = { path: "manage/en-US" };
    const previewOpts = { path: "preview/en-US" };

    const manage = usePageManageHandler(manageOpts);

    const authorManager = useAuthorManageHandler({
        ...manageOpts
    });

    beforeEach(async () => {
        await setupGroupAndModels({
            manager: manage,
            models: ["author", pageModel as unknown as CmsModel]
        });
        await setupAuthor({
            manager: authorManager
        });
    });

    it("should create a page with dynamic zone fields", async () => {
        const [createPageResponse] = await manage.createPage({
            data: contentEntryMutationData
        });

        expect(createPageResponse).toEqual({
            data: {
                createPage: {
                    data: {
                        id: expect.any(String),
                        ...withTemplateId(contentEntryQueryData)
                    },
                    error: null
                }
            }
        });

        const [updatePageResponse] = await manage.updatePage({
            revision: createPageResponse.data.createPage.data.id,
            data: contentEntryMutationData
        });

        expect(updatePageResponse).toEqual({
            data: {
                updatePage: {
                    data: {
                        id: expect.any(String),
                        ...withTemplateId(contentEntryQueryData)
                    },
                    error: null
                }
            }
        });

        const page = createPageResponse.data.createPage.data;

        const [manageList] = await manage.listPages();

        expect(manageList).toEqual({
            data: {
                listPages: {
                    data: [
                        {
                            id: page.id,
                            ...withTemplateId(contentEntryQueryData)
                        }
                    ],
                    meta: {
                        totalCount: 1,
                        hasMoreItems: false,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        // Test `manage` get
        const [manageGet] = await manage.getPage({
            revision: page.id
        });

        expect(manageGet).toEqual({
            data: {
                getPage: {
                    data: {
                        id: page.id,
                        ...withTemplateId(contentEntryQueryData)
                    },
                    error: null
                }
            }
        });

        const preview = usePageReadHandler(previewOpts);

        // Test `read` get
        const previewGet = await preview
            .getPage({
                where: {
                    id: page.id
                }
            })
            .then(([data]) => data);

        expect(previewGet).toEqual({
            data: {
                getPage: {
                    data: {
                        id: page.id,
                        ...contentEntryQueryData,
                        content: [
                            ...contentEntryQueryData.content.slice(0, 3),
                            {
                                ...contentEntryQueryData.content[3],
                                dynamicZone: {
                                    authors: [
                                        {
                                            entryId: "john-doe",
                                            fullName: "John Doe",
                                            id: "john-doe#0001",
                                            modelId: "author"
                                        }
                                    ]
                                }
                            },
                            {
                                __typename: contentEntryQueryData.content[4].__typename,
                                author: {
                                    entryId: "john-doe",
                                    fullName: "John Doe",
                                    id: "john-doe#0001",
                                    modelId: "author"
                                },
                                authors: [
                                    {
                                        entryId: "john-doe",
                                        fullName: "John Doe",
                                        id: "john-doe#0001",
                                        modelId: "author"
                                    }
                                ]
                            }
                        ],
                        reference: {
                            author: {
                                entryId: "john-doe",
                                fullName: "John Doe",
                                id: "john-doe#0001",
                                modelId: "author"
                            }
                        },
                        references1: {
                            authors: [
                                {
                                    entryId: "john-doe",
                                    fullName: "John Doe",
                                    id: "john-doe#0001",
                                    modelId: "author"
                                }
                            ]
                        },
                        references2: [
                            {
                                author: {
                                    entryId: "john-doe",
                                    fullName: "John Doe",
                                    id: "john-doe#0001",
                                    modelId: "author"
                                }
                            }
                        ]
                    },
                    error: null
                }
            }
        });
    });
});
