import { CmsGroup } from "~/types";
import { pageModel } from "./mocks/pageWithDynamicZonesModel";
import { usePageManageHandler } from "../testHelpers/usePageManageHandler";

const contentEntryQueryData = {
    content: [
        {
            text: "Simple Text #1"
        },
        {
            title: "Hero Title #1"
        },
        {
            title: "Hero Title #2"
        }
    ],
    header: {
        title: "Header #1",
        image: "https://d3bwcib4j08r73.cloudfront.net/files/webiny-serverless-cms.png"
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

    const handler = usePageManageHandler(manageOpts);

    // This function is not directly within `beforeEach` as we don't always setup the same content model.
    // We call this function manually at the beginning of each test, where needed.
    const setupContentModelGroup = async (): Promise<CmsGroup> => {
        const [createCMG] = await handler.createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: "ico/ico",
                description: "description"
            }
        });
        return createCMG.data.createContentModelGroup.data;
    };

    const setupContentModel = async (contentModelGroup: CmsGroup) => {
        const model = pageModel;

        // Create initial record
        const [create] = await handler.createContentModelMutation({
            data: {
                name: model.name,
                modelId: model.modelId,
                group: contentModelGroup.id
            }
        });

        if (create.errors) {
            console.error(`[beforeEach] ${create.errors[0].message}`);
            process.exit(1);
        }

        const [update] = await handler.updateContentModelMutation({
            modelId: create.data.createContentModel.data.modelId,
            data: {
                fields: model.fields,
                layout: model.layout
            }
        });
        return update.data.updateContentModel.data;
    };

    test("should create a page with dynamic zone fields", async () => {
        const contentModelGroup = await setupContentModelGroup();
        await setupContentModel(contentModelGroup);

        const [createPageResponse] = await handler.createPage({
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

        const [response] = await handler.getPage({
            where: {
                id: page.id
            }
        });

        expect(response).toEqual({
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
