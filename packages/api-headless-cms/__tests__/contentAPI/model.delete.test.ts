import { beforeEach, describe, expect, it } from "vitest";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";
import type { CmsModel } from "~/types/index.js";

describe("model delete", () => {
    const manageOpts = { path: "manage" };

    const manager = useGraphQLHandler(manageOpts);

    const { deleteContentModelMutation } = manager;

    let model: Pick<CmsModel, "modelId">;

    beforeEach(async () => {
        const result = await setupGroupAndModels({
            manager,
            models: ["category"]
        });
        model = result.getModel("category");
    });

    it("should be able to delete model when there are no more entries", async () => {
        const { createCategory, deleteCategory } = useCategoryManageHandler({
            ...manageOpts
        });

        const createPromises = [];
        for (let i = 0; i < 1; i++) {
            createPromises.push(
                createCategory({
                    variables: {
                        data: {
                            values: {
                                title: `Category #${i}`,
                                slug: `category-${i}`
                            }
                        }
                    }
                })
            );
        }
        const categories = await Promise.all(createPromises).then(responses => {
            return responses.map(([response]) => {
                return response.data.createCategory.data!;
            });
        });

        const [deleteFailResponse] = await deleteContentModelMutation({
            modelId: model.modelId
        });

        expect(deleteFailResponse).toEqual({
            data: {
                deleteContentModel: {
                    data: null,
                    error: {
                        code: "Cms/Model/CannotDeleteHasEntries",
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
                    variables: {
                        revision: category.id
                    }
                })
            );
        }
        await Promise.all(deletePromises);

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
