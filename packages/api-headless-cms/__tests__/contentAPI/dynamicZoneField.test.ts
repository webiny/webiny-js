import { pageModel } from "./mocks/pageWithDynamicZonesModel";
import { setupGroupAndModels } from "../testHelpers/setup";
import { usePageManageHandler } from "../testHelpers/usePageManageHandler";
import { usePageReadHandler } from "../testHelpers/usePageReadHandler";

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
    }
};

const contentEntryMutationDataObjectWithDynamicZone = {
    content: [],
    bottomObj: {
        footer: {
            FooterDynamicZone: {
                footerText: "Footer text #1"
            }
        }
    }
};
const contentEntryMutationData = {
    ...contentEntryMutationDataObjectWithDynamicZone,
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
    }
};

describe("dynamicZone field", () => {
    const manageOpts = { path: "manage/en-US" };
    const previewOpts = { path: "preview/en-US" };

    const manage = usePageManageHandler(manageOpts);
    const preview = usePageReadHandler(previewOpts);

    test("should create a page with dynamic zone fields", async () => {
        await setupGroupAndModels({ manager: manage, models: [pageModel as any] });

        const [createPageResponse] = await manage.createPage({
            data: contentEntryMutationData
        });

        expect(createPageResponse).toEqual({
            data: {
                createPage: {
                    data: {
                        id: expect.any(String),
                        content: contentEntryQueryData.content,
                        header: contentEntryQueryData.header,
                        objective: contentEntryQueryData.objective,
                        bottomObj: {
                            footer: null
                        }
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
                            content: contentEntryQueryData.content,
                            header: contentEntryQueryData.header,
                            objective: contentEntryQueryData.objective,
                            bottomObj: {
                                footer: null
                            }
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
                        content: contentEntryQueryData.content,
                        header: contentEntryQueryData.header,
                        objective: contentEntryQueryData.objective,
                        bottomObj: {
                            footer: null
                        }
                    },
                    error: null
                }
            }
        });

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
                        content: contentEntryQueryData.content,
                        header: contentEntryQueryData.header,
                        objective: contentEntryQueryData.objective,
                        bottomObj: {
                            footer: null
                        }
                    },
                    error: null
                }
            }
        });
    });

    it("should create a page with object containing a dynamic zone field", async () => {
        await setupGroupAndModels({ manager: manage, models: [pageModel as any] });

        const [createPageResponse] = await manage.createPage({
            data: contentEntryMutationDataObjectWithDynamicZone
        });

        expect(createPageResponse).toEqual({
            data: {
                createPage: {
                    data: {
                        id: expect.any(String),
                        content: [],
                        header: null,
                        objective: null,
                        bottomObj: {
                            footer: {
                                footerText: "Footer text #1"
                            }
                        }
                    },
                    error: null
                }
            }
        });
    });
});
