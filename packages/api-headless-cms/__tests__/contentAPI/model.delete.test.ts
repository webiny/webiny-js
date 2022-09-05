import { CmsGroup } from "~/types";
import models from "./mocks/contentModels";
import { useGraphQLHandler } from "../utils/useGraphQLHandler";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";

describe("model delete", () => {
    const manageOpts = { path: "manage/en-US" };

    const {
        createContentModelMutation,
        updateContentModelMutation,
        deleteContentModelMutation,
        createContentModelGroupMutation
    } = useGraphQLHandler(manageOpts);

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

    const setupCategoryModel = async (group: CmsGroup) => {
        const model = models.find(m => m.modelId === "category");
        if (!model) {
            throw new Error(`Could not find model "category".`);
        }

        const [create] = await createContentModelMutation({
            data: {
                name: model.name,
                modelId: model.modelId,
                group: group.id
            }
        });

        if (create.errors) {
            console.error(`[beforeEach] ${create.errors[0].message}`);
            process.exit(1);
        } else if (create.data.createContentModel.error) {
            console.error(create.data.createContentModel.error);
            process.exit(1);
        }

        const [update] = await updateContentModelMutation({
            modelId: create.data.createContentModel.data.modelId,
            data: {
                fields: model.fields,
                layout: model.layout
            }
        });
        if (update.errors) {
            console.error(`[beforeEach] ${update.errors[0].message}`);
            process.exit(1);
        } else if (update.data.updateContentModel.error) {
            console.error(update.data.updateContentModel.error);
            process.exit(1);
        }

        return update.data.updateContentModel.data;
    };

    it("should be able to delete model when there are no more entries", async () => {
        const { createCategory, deleteCategory, listCategories, until } = useCategoryManageHandler({
            ...manageOpts
        });

        const group = await setupGroup();
        const model = await setupCategoryModel(group);

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

        const [deleteFailResponse] = await deleteContentModelMutation({
            modelId: model.modelId
        });

        expect(deleteFailResponse).toEqual({
            data: {
                deleteContentModel: {
                    data: null,
                    error: {
                        code: "CONTENT_MODEL_BEFORE_DELETE_HOOK_FAILED",
                        data: null,
                        message: `Cannot delete content model "category" because there are existing entries.`
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
        await Promise.all(deletePromises);
        await until(
            () => listCategories().then(([data]) => data),
            ({ data }: any) => data.listCategories.data.length === 0,
            {
                name: "after delete categories"
            }
        );

        const [deleteSuccessResponse] = await deleteContentModelMutation({
            modelId: model.modelId
        });

        expect(deleteSuccessResponse).toEqual({
            data: {
                deleteContentModel: {
                    data: true,
                    error: null
                }
            }
        });
    });
});
