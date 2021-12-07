import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { CmsGroup, CmsModel } from "~/types";
import models from "./mocks/contentModels";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";

describe("Republish entries", () => {
    const manageOpts = { path: "manage/en-US" };

    const {
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useContentGqlHandler(manageOpts);

    // This function is not directly within `beforeEach` as we don't always setup the same content model.
    // We call this function manually at the beginning of each test, where needed.
    const setupGroup = async (): Promise<CmsGroup> => {
        const [createCMG] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: "ico/ico",
                description: "description"
            }
        });
        return createCMG.data.createContentModelGroup.data;
    };

    const setupCategoryModel = async (contentModelGroup: CmsGroup): Promise<CmsModel> => {
        const model = models.find(m => m.modelId === "category");
        // Create initial record
        const [create] = await createContentModelMutation({
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

        const [update] = await updateContentModelMutation({
            modelId: create.data.createContentModel.data.modelId,
            data: {
                fields: model.fields,
                layout: model.layout
            }
        });
        return update.data.updateContentModel.data;
    };

    test("should republish entries without changing them", async () => {
        const group = await setupGroup();
        await setupCategoryModel(group);

        const { createCategory, publishCategory, republishCategory } =
            useCategoryManageHandler(manageOpts);

        /**
         * Create test categories.
         */
        const [appleResponse] = await createCategory({
            data: {
                title: "Apple",
                slug: "apple"
            }
        });
        const appleOriginal = appleResponse.data.createCategory.data;
        const [bananaResponse] = await createCategory({
            data: {
                title: "Banana",
                slug: "banana"
            }
        });
        const bananaOriginal = bananaResponse.data.createCategory.data;
        const [orangeResponse] = await createCategory({
            data: {
                title: "Orange",
                slug: "orange"
            }
        });
        const orangeOriginal = orangeResponse.data.createCategory.data;

        /**
         * Publish all the categories.
         */
        const [applePublishResponse] = await publishCategory({
            revision: appleOriginal.id
        });
        const apple = applePublishResponse.data.publishCategory.data;

        const [bananaPublishResponse] = await publishCategory({
            revision: bananaOriginal.id
        });
        const banana = bananaPublishResponse.data.publishCategory.data;
        const [orangePublishResponse] = await publishCategory({
            revision: orangeOriginal.id
        });
        const orange = orangePublishResponse.data.publishCategory.data;
        /**
         * Now we republish all categories and expect they did not change.
         */
        const [appleRepublishResponse] = await republishCategory({
            revision: appleOriginal.id
        });
        expect(appleRepublishResponse).toEqual({
            data: {
                republishCategory: {
                    data: apple,
                    error: null
                }
            }
        });
        const [bananaRepublishResponse] = await republishCategory({
            revision: bananaOriginal.id
        });
        expect(bananaRepublishResponse).toEqual({
            data: {
                republishCategory: {
                    data: banana,
                    error: null
                }
            }
        });
        const [orangeRepublishResponse] = await republishCategory({
            revision: orangeOriginal.id
        });
        expect(orangeRepublishResponse).toEqual({
            data: {
                republishCategory: {
                    data: orange,
                    error: null
                }
            }
        });
    });

    test("should not allow republishing of unpublished entries", async () => {
        const group = await setupGroup();
        await setupCategoryModel(group);

        const { createCategory, republishCategory } = useCategoryManageHandler(manageOpts);

        /**
         * Create test categories.
         */
        const [appleResponse] = await createCategory({
            data: {
                title: "Apple",
                slug: "apple"
            }
        });
        const apple = appleResponse.data.createCategory.data;

        const [appleRepublishResponse] = await republishCategory({
            revision: apple.id
        });
        expect(appleRepublishResponse).toEqual({
            data: {
                republishCategory: {
                    data: null,
                    error: {
                        message: "Entry with given ID is not published!",
                        code: "NOT_PUBLISHED_ERROR",
                        data: expect.any(Object)
                    }
                }
            }
        });
    });
});
