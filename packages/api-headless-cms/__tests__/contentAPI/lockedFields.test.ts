import { useGraphQLHandler } from "../utils/useGraphQLHandler";
import { CmsEntry, CmsGroup, CmsModel } from "~/types";
import models from "./mocks/contentModels";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import { useProductManageHandler } from "../utils/useProductManageHandler";

describe("Content model locked fields", () => {
    const manageOpts = { path: "manage/en-US" };

    const {
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useGraphQLHandler(manageOpts);

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
        if (!model) {
            throw new Error(`Could not find model "category".`);
        }
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
        const contentModelGroup = await setupGroup();

        const categoryContentModel = await setupCategoryModel(contentModelGroup);

        const [createCategoryResponse] = await createCategory({
            data: {
                title: "Vegetables",
                slug: "vegetables"
            }
        });
        const category = createCategoryResponse.data.createCategory.data as CmsEntry;

        const productModel = models.find(m => m.modelId === "product");
        if (!productModel) {
            throw new Error(`Could not find model "product".`);
        }
        const [createResponse] = await createContentModelMutation({
            data: {
                name: productModel.name,
                modelId: productModel.modelId,
                group: contentModelGroup.id
            }
        });

        const contentModel = createResponse.data.createContentModel.data as CmsModel;

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
                    id: category.id
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

    it("should allow deleting fields when no entries are present", async () => {
        const { createCategory, deleteCategory, listCategories, until } = useCategoryManageHandler({
            ...manageOpts
        });

        const group = await setupGroup();
        const model = await setupCategoryModel(group);

        const slugField = model.fields.find(field => field.fieldId === "slug");
        if (!slugField) {
            throw new Error(`Could not find field "slug".`);
        }

        const createPromises = [];
        for (let i = 0; i < 1; i++) {
            createPromises.push(
                createCategory({
                    data: {
                        title: `Category #${i}`,
                        slug: `category-${i}`
                    }
                })
            );
        }
        const categories = await Promise.all(createPromises).then(responses => {
            return responses.map(([response]) => {
                return response.data.createCategory.data;
            });
        });

        await until(
            () => listCategories().then(([data]) => data),
            ({ data }: any) => data.listCategories.data.length === categories.length,
            {
                name: "after create categories"
            }
        );

        const fields = model.fields.filter(field => {
            return field.fieldId !== slugField.fieldId;
        });
        const layout = model.layout.filter(layouts => {
            return layouts.includes(slugField.id) === false;
        });
        const [updateModelFailResponse] = await updateContentModelMutation({
            modelId: model.modelId,
            data: {
                fields,
                layout
            }
        });

        expect(updateModelFailResponse).toEqual({
            data: {
                updateContentModel: {
                    data: null,
                    error: {
                        code: "ENTRY_FIELD_USED",
                        data: null,
                        message: `Cannot remove the field "slug" because it's already in use in created content.`
                    }
                }
            }
        });

        const deletePromises = [];
        for (const category of categories) {
            deletePromises.push(
                deleteCategory({
                    revision: category.id
                })
            );
        }
        const deleteResults = await Promise.all(deletePromises).then(responses => {
            return responses.map(([response]) => {
                return response.data.deleteCategory.data;
            });
        });
        expect(deleteResults).toEqual(categories.map(() => true));

        await until(
            () => listCategories().then(([data]) => data),
            ({ data }: any) => data.listCategories.data.length === 0,
            {
                name: "after delete categories"
            }
        );

        const [updateModelSuccessResponse] = await updateContentModelMutation({
            modelId: model.modelId,
            data: {
                fields,
                layout
            }
        });

        expect(updateModelSuccessResponse).toEqual({
            data: {
                updateContentModel: {
                    data: {
                        ...model,
                        fields,
                        layout,
                        savedOn: expect.stringMatching(/^20/)
                    },
                    error: null
                }
            }
        });
    });
});
