import { pageModel } from "./mocks/pageWithDynamicZonesModel";
import { setupGroupAndModels } from "../testHelpers/setup";
import { usePageManageHandler } from "../testHelpers/usePageManageHandler";
import { usePageReadHandler } from "../testHelpers/usePageReadHandler";

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
        }
    ],
    header: {
        title: "Header #1",
        image: "https://d3bwcib4j08r73.cloudfront.net/files/webiny-serverless-cms.png",
        __typename: "Page_Header_ImageHeader"
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
        }
    ],
    header: {
        ImageHeader: {
            title: "Header #1",
            image: "https://d3bwcib4j08r73.cloudfront.net/files/webiny-serverless-cms.png"
        }
    }
};

describe("dynamicZone field", () => {
    const manageOpts = { path: "manage/en-US" };
    const previewOpts = { path: "preview/en-US" };

    const manage = usePageManageHandler(manageOpts);
    const preview = usePageReadHandler(previewOpts);

    test("should create a page with dynamic zone fields", async () => {
        await setupGroupAndModels({ manager: manage, models: [pageModel] });

        const [createPageResponse] = await manage.createPage({
            data: contentEntryMutationData
        });

        expect(createPageResponse).toEqual({
            data: {
                createPage: {
                    data: {
                        id: expect.any(String),
                        content: contentEntryQueryData.content,
                        header: contentEntryQueryData.header
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
                        header: contentEntryQueryData.header
                    },
                    error: null
                }
            }
        });

        // Test `read` get
        const [previewGet] = await preview.getPage({
            where: {
                id: page.id
            }
        });

        expect(previewGet).toEqual({
            data: {
                getPage: {
                    data: {
                        id: page.id,
                        content: contentEntryQueryData.content,
                        header: contentEntryQueryData.header
                    },
                    error: null
                }
            }
        });
    });
});
