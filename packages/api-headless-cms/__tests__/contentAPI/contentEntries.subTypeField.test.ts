import { beforeEach, describe, expect, it } from "vitest";
import { useCategoryManageHandler } from "~tests/testHelpers/useCategoryManageHandler.js";
import { CmsGroup } from "~/types/index.js";
import models from "~tests/contentAPI/mocks/contentModels.js";
import type { CmsModel } from "~tests/types.js";

describe("content entries with subtype field", () => {
    const manageOpts = {
        path: "manage/en-US"
    };

    const {
        createCategory,
        listCategories,
        createContentModelGroupMutation,
        createContentModelMutation,
        updateContentModelMutation
    } = useCategoryManageHandler(manageOpts);

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

    const setupContentModel = async (contentModelGroup: CmsGroup, name: string) => {
        const model = models.find(m => m.modelId === name);
        if (!model) {
            throw new Error(`Could not find model "${name}".`);
        }
        // Create initial record
        const [create] = await createContentModelMutation({
            data: {
                name: model.name,
                modelId: model.modelId,
                singularApiName: model.singularApiName,
                pluralApiName: model.pluralApiName,
                group: contentModelGroup.id
            }
        });

        const [updated] = await updateContentModelMutation({
            modelId: create.data.createContentModel.data.modelId,
            data: {
                fields: model.fields,
                layout: model.layout
            }
        });
        return updated.data.updateContentModel.data as CmsModel;
    };

    let categoryModel: CmsModel;

    beforeEach(async () => {
        const group = await setupContentModelGroup();
        categoryModel = await setupContentModel(group, "category");
    });

    it("should handle subtype fields correctly", async () => {
        const [updatedModelResponse] = await updateContentModelMutation({
            modelId: categoryModel.modelId,
            data: {
                fields: [
                    ...categoryModel.fields,
                    {
                        id: "separator",
                        type: "text:separator",
                        label: "Separator",
                        multipleValues: false,
                        helpText: "",
                        storageId: "text@separator",
                        fieldId: "separator"
                    }
                ],
                layout: [...categoryModel.layout, ["separator"]]
            }
        });

        expect(updatedModelResponse).toMatchObject({
            data: {
                updateContentModel: {
                    data: {
                        modelId: categoryModel.modelId,
                        fields: [
                            ...categoryModel.fields,
                            {
                                id: "separator",
                                type: "text:separator",
                                fieldId: "separator"
                            }
                        ],
                        layout: [...categoryModel.layout, ["separator"]]
                    },
                    error: null
                }
            }
        });

        const [createResponse] = await createCategory(
            {
                data: {
                    title: "Test Category",
                    slug: "test-category",
                    separator: "This is a separator"
                }
            },
            {},
            ["separator"]
        );
        expect(createResponse).toMatchObject({
            data: {
                createCategory: {
                    data: {
                        id: expect.any(String),
                        title: "Test Category",
                        slug: "test-category",
                        separator: "This is a separator"
                    },
                    error: null
                }
            }
        });

        const [listResponse] = await listCategories({}, {}, ["separator"]);
        expect(listResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: expect.any(String),
                            title: "Test Category",
                            slug: "test-category",
                            separator: "This is a separator"
                        }
                    ],
                    error: null
                }
            }
        });
    });
});
