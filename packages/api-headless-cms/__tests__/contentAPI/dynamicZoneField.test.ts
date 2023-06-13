import { pageModel } from "./mocks/pageWithDynamicZonesModel";
import { setupGroupAndModels } from "../testHelpers/setup";
import { usePageManageHandler } from "../testHelpers/usePageManageHandler";
import { usePageReadHandler } from "../testHelpers/usePageReadHandler";
import { useAuthorManageHandler } from "~tests/testHelpers/useAuthorManageHandler";

const singularPageApiName = pageModel.singularApiName;

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
                objectNestedObject: [
                    {
                        nestedObjectNestedTitle: "Objective nested title #1"
                    },
                    {
                        nestedObjectNestedTitle: "Objective nested title #2"
                    }
                ],
                objectTitle: "Objective title #1"
            }
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
    references: [
        {
            author: {
                id: "john-doe#0001",
                modelId: "author",
                __typename: "RefField"
            },
            __typename: `${singularPageApiName}_References_Author`
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
                            nestedObjectNestedTitle: "Objective nested title #1"
                        },
                        {
                            nestedObjectNestedTitle: "Objective nested title #2"
                        }
                    ]
                }
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
    references: [
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
        await setupGroupAndModels({ manager: manage, models: ["author", pageModel as any] });
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
                        ...contentEntryQueryData
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
                            ...contentEntryQueryData
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
                        ...contentEntryQueryData
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
                        reference: {
                            author: {
                                entryId: "john-doe",
                                fullName: "John Doe",
                                id: contentEntryQueryData.reference.author.id,
                                modelId: contentEntryQueryData.reference.author.modelId
                            }
                        },
                        references: [
                            {
                                author: {
                                    entryId: "john-doe",
                                    fullName: "John Doe",
                                    id: contentEntryQueryData.references[0].author.id,
                                    modelId: contentEntryQueryData.references[0].author.modelId
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
