import { pageModel } from "./mocks/pageWithDynamicZonesModel";
import { setupGroupAndModels } from "../testHelpers/setup";
import { usePageManageHandler } from "../testHelpers/usePageManageHandler";
import { usePageReadHandler } from "../testHelpers/usePageReadHandler";
import { until } from "../testHelpers/helpers";

const contentEntryQueryData = {
    content: [
        {
            text: "Simple Text #1",
            __typename: "Page_Content_SimpleText"
        },
        {
            title: "Hero Title #1",
            __typename: "Page_Content_Hero"
        },
        {
            title: "Hero Title #2",
            __typename: "Page_Content_Hero"
        },
        {
            __typename: "Page_Content_Objecting",
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
        __typename: "Page_Header_ImageHeader"
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
            objectTitle: "Objective title #1"
        },
        __typename: "Page_Objective_Objecting"
    }
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
                        objective: contentEntryQueryData.objective
                    },
                    error: null
                }
            }
        });

        const page = createPageResponse.data.createPage.data;

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
                        objective: contentEntryQueryData.objective
                    },
                    error: null
                }
            }
        });

        // Test `read` get
        const previewGet = await until(
            () => {
                return preview
                    .getPage({
                        where: {
                            id: page.id
                        }
                    })
                    .then(([data]) => data);
            },
            ({ data }: any) => {
                return data.getPage.data !== null;
            },
            {
                name: "get page from /read endpoint",
                tries: 20,
                debounce: 2000,
                wait: 2000
            }
        );

        expect(previewGet).toEqual({
            data: {
                getPage: {
                    data: {
                        id: page.id,
                        content: contentEntryQueryData.content,
                        header: contentEntryQueryData.header,
                        objective: contentEntryQueryData.objective
                    },
                    error: null
                }
            }
        });
    });
});
