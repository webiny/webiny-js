import models from "../../contentAPI/mocks/contentModels";
import { CmsGroup, CmsModel } from "~/types";
import { ProductManager } from "../../types";

const createModelFactory = (manager: ProductManager, group: CmsGroup) => {
    return async (modelId: string) => {
        const model = models.find(m => m.modelId === modelId);
        if (!model) {
            throw new Error(`There is no model "${modelId}".`);
        }
        const [createResponse] = await manager.createContentModelMutation({
            data: {
                name: model.name,
                modelId: model.modelId,
                group: group.id
            }
        });

        const [updateResponse] = await manager.updateContentModelMutation({
            modelId: createResponse.data.createContentModel.data.modelId,
            data: {
                fields: model.fields,
                layout: model.layout
            }
        });
        return updateResponse.data.updateContentModel.data as CmsModel;
    };
};

interface Response {
    group: CmsGroup;
    productModel: CmsModel;
    categoryModel: CmsModel;
}
export const createInitFactory = (manager: ProductManager) => {
    return async (): Promise<Response> => {
        const [groupResponse] = await manager.createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: "ico/ico",
                description: "description"
            }
        });
        const group = groupResponse.data.createContentModelGroup.data as CmsGroup;

        const createModel = createModelFactory(manager, group);

        return {
            group,
            productModel: await createModel("product"),
            categoryModel: await createModel("category")
        };
    };
};
