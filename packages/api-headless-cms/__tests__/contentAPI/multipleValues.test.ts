import { CmsEntry, CmsGroup, CmsModel, CmsModelField } from "~/types";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import models from "./mocks/contentModels";
import { useProductManageHandler } from "../utils/useProductManageHandler";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";

describe("multiple values in field", () => {
    const manageOpts = { path: "manage/en-US" };

    const {
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useContentGqlHandler(manageOpts);

    // This function is not directly within `beforeEach` as we don't always setup the same content model.
    // We call this function manually at the beginning of each test, where needed.
    const setupContentModelGroup = async (): Promise<CmsGroup> => {
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

    const setupCategoryModel = async (contentModelGroup: CmsGroup) => {
        const model = models.find(m => m.modelId === "category");
        if (!model) {
            throw new Error(`Could not find model "category".`);
        }
        // Create initial record
        const [create] = await createContentModelMutation({
            data: {
                name: model.name,
                modelId: model.modelId,
                group: contentModelGroup.id,
                fields: model.fields,
                layout: model.layout
            }
        });

        if (create.errors) {
            console.error(`[beforeEach] ${create.errors[0].message}`);
            process.exit(1);
        }

        return create.data.createContentModel.data;
    };

    test("multiple value field is correctly created", async () => {
        const contentModelGroup = await setupContentModelGroup();

        const model = models.find(m => m.modelId === "product");
        if (!model) {
            throw new Error(`Could not find model "product".`);
        }
        const [createResponse] = await createContentModelMutation({
            data: {
                name: model.name,
                modelId: model.modelId,
                group: contentModelGroup.id
            }
        });

        const contentModel = createResponse.data.createContentModel.data;

        const [updateResponse] = await updateContentModelMutation({
            modelId: contentModel.modelId,
            data: {
                fields: model.fields,
                layout: model.layout
            }
        });

        const updatedContentModel: any = updateResponse.data.updateContentModel.data;

        const multipleValueFields = updatedContentModel.fields.filter((field: CmsModelField) => {
            return field.multipleValues === true;
        });

        expect(multipleValueFields).toEqual([
            {
                id: expect.any(String),
                multipleValues: true,
                helpText: "",
                label: "Available sizes",
                fieldId: "availableSizes",
                type: "text",
                settings: {
                    type: "text"
                },
                validation: [
                    {
                        name: "required",
                        message: "Please select from list of sizes",
                        settings: {}
                    }
                ],
                listValidation: [],
                placeholderText: "placeholder text",
                predefinedValues: {
                    enabled: true,
                    values: [
                        {
                            label: "s",
                            value: "s"
                        },
                        {
                            label: "m",
                            value: "m"
                        },
                        {
                            label: "l",
                            value: "l"
                        },
                        {
                            label: "xl",
                            value: "xl"
                        }
                    ]
                },
                renderer: {
                    name: "renderer"
                }
            }
        ]);
    });

    test("should not allow multipleValue field to be set as title", async () => {
        const contentModelGroup = await setupContentModelGroup();

        const model = models.find(m => m.modelId === "product");
        if (!model) {
            throw new Error(`Could not find model "product".`);
        }
        const [createResponse] = await createContentModelMutation({
            data: {
                name: model.name,
                modelId: model.modelId,
                group: contentModelGroup.id
            }
        });

        const contentModel = createResponse.data.createContentModel.data;

        const [response] = await updateContentModelMutation({
            modelId: contentModel.modelId,
            data: {
                titleFieldId: "availableSizes",
                fields: model.fields,
                layout: model.layout
            }
        });

        expect(response).toEqual({
            data: {
                updateContentModel: {
                    data: null,
                    error: {
                        code: "ENTRY_TITLE_FIELD_TYPE",
                        message:
                            "Fields that accept multiple values cannot be used as the entry title.",
                        data: {
                            fieldId: "availableSizes",
                            type: "text"
                        }
                    }
                }
            }
        });
    });

    test("should not allow to change or removal of locked multiple values field", async () => {
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

        const availableOn = "2020-12-25";
        const [createProductResponse] = await createProduct({
            data: {
                title: "Potato",
                price: 100.02,
                availableOn,
                color: "white",
                availableSizes: ["s", "m"],
                image: "file.jpg",
                category: {
                    modelId: categoryContentModel.modelId,
                    id: category.id
                },
                richText: [
                    {
                        tag: "p",
                        value: "some text"
                    }
                ]
            }
        });

        expect(createProductResponse).toEqual({
            data: {
                createProduct: {
                    data: {
                        id: expect.any(String),
                        entryId: expect.any(String),
                        createdOn: expect.stringMatching(/^20/),
                        createdBy: {
                            id: "12345678",
                            displayName: "John Doe",
                            type: "admin"
                        },
                        savedOn: expect.stringMatching(/^20/),
                        category: {
                            modelId: categoryContentModel.modelId,
                            id: category.id,
                            entryId: category.entryId
                        },
                        title: "Potato",
                        color: "white",
                        price: 100.02,
                        availableOn,
                        availableSizes: ["s", "m"],
                        inStock: null,
                        itemsInStock: null,
                        variant: null,
                        richText: [
                            {
                                tag: "p",
                                value: "some text"
                            }
                        ],
                        meta: {
                            locked: false,
                            modelId: "product",
                            publishedOn: null,
                            revisions: [
                                {
                                    id: expect.any(String),
                                    title: "Potato"
                                }
                            ],
                            status: "draft",
                            title: "Potato",
                            version: 1
                        }
                    },
                    error: null
                }
            }
        });

        const fieldsWithNoMultipleValues = productModel.fields.filter(
            field => !field.multipleValues
        );

        const [removedMultipleValuesResponse] = await updateContentModelMutation({
            modelId: contentModel.modelId,
            data: {
                titleFieldId: null,
                fields: fieldsWithNoMultipleValues,
                layout: fieldsWithNoMultipleValues.map(field => {
                    return [field.id];
                })
            }
        });

        expect(removedMultipleValuesResponse).toEqual({
            data: {
                updateContentModel: {
                    data: null,
                    error: {
                        code: "ENTRY_FIELD_USED",
                        data: null,
                        message: `Cannot remove the field "availableSizes" because it's already in use in created content.`
                    }
                }
            }
        });

        const modifiedMultipleValuesFields = productModel.fields.map(field => {
            if (!field.multipleValues) {
                return field;
            }
            return {
                ...field,
                multipleValues: false
            };
        });

        const [changedMultipleValuesResponse] = await updateContentModelMutation({
            modelId: contentModel.modelId,
            data: {
                titleFieldId: null,
                fields: modifiedMultipleValuesFields,
                layout: modifiedMultipleValuesFields.map(field => {
                    return [field.id];
                })
            }
        });

        expect(changedMultipleValuesResponse).toEqual({
            data: {
                updateContentModel: {
                    data: null,
                    error: {
                        code: "ENTRY_FIELD_USED",
                        data: null,
                        message: `Cannot change "multipleValues" for the "availableSizes" field because it's already in use in created content.`
                    }
                }
            }
        });
    });
});
