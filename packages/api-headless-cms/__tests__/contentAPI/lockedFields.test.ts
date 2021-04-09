import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { CmsContentEntry, CmsContentModelGroup, CmsContentModel } from "../../src/types";
import models from "./mocks/contentModels";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import { useProductManageHandler } from "../utils/useProductManageHandler";

describe("Content model locked fields", () => {
    const manageOpts = { path: "manage/en-US" };

    const {
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useContentGqlHandler(manageOpts);

    // This function is not directly within `beforeEach` as we don't always setup the same content model.
    // We call this function manually at the beginning of each test, where needed.
    const setupContentModelGroup = async (): Promise<CmsContentModelGroup> => {
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

    const setupCategoryModel = async (contentModelGroup: CmsContentModelGroup) => {
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

    test("must mark fields as used and prevent changes on it, as soon as the first entry is saved", async () => {
        const { createCategory } = useCategoryManageHandler({
            ...manageOpts
        });
        const contentModelGroup = await setupContentModelGroup();

        const categoryContentModel = await setupCategoryModel(contentModelGroup);

        const [createCategoryResponse] = await createCategory({
            data: {
                title: "Vegetables",
                slug: "vegetables"
            }
        });
        const category = createCategoryResponse.data.createCategory.data as CmsContentEntry;

        const productModel = models.find(m => m.modelId === "product");
        const [createResponse] = await createContentModelMutation({
            data: {
                name: productModel.name,
                modelId: productModel.modelId,
                group: contentModelGroup.id
            }
        });

        const contentModel = createResponse.data.createContentModel.data as CmsContentModel;

        await updateContentModelMutation({
            modelId: contentModel.modelId,
            data: {
                fields: productModel.fields,
                layout: productModel.layout
            }
        });

        // create a entry so fields get locked
        const { createProduct } = useProductManageHandler({
            ...manageOpts
        });

        await createProduct({
            data: {
                title: "Potato",
                price: 100,
                availableOn: "2020-12-25",
                color: "white",
                availableSizes: ["s", "m"],
                image: "file.jpg",
                category: {
                    modelId: categoryContentModel.modelId,
                    entryId: category.id
                }
            }
        });

        // when removing field one by one error must be thrown that given field cannot be removed
        const fieldsToRemove = productModel.fields.filter(field => field.fieldId !== "title");
        for (const field of fieldsToRemove) {
            const targetFields = productModel.fields.filter(f => f.id !== field.id);
            const [removedFieldResponse] = await updateContentModelMutation({
                modelId: contentModel.modelId,
                data: {
                    titleFieldId: null,
                    fields: targetFields,
                    layout: targetFields.map(f => {
                        return [f.id];
                    })
                }
            });

            expect(removedFieldResponse).toEqual({
                data: {
                    updateContentModel: {
                        data: null,
                        error: {
                            code: "ENTRY_FIELD_USED",
                            data: null,
                            message: `Cannot remove the field "${field.fieldId}" because it's already in use in created content.`
                        }
                    }
                }
            });
        }
    });
});
