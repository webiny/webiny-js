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
                singularApiName: model.singularApiName,
                pluralApiName: model.pluralApiName,
                group: group.id
            }
        });
        const error = createResponse.data?.createContentModel?.error;
        if (error) {
            console.log(`Error while creating content model "${modelId}".`);
            console.log(JSON.stringify(error));
            throw new Error(error.message, error.code);
        }

        const [updateResponse] = await manager.updateContentModelMutation({
            modelId: createResponse.data.createContentModel.data.modelId,
            data: {
                fields: model.fields,
                layout: model.layout
            }
        });
        const updateError = updateResponse.data?.updateContentModel?.error;
        if (updateError) {
            console.log(`Error while updating content model "${modelId}".`);
            console.log(JSON.stringify(updateError));
            throw new Error(updateError.message, updateError.code);
        }
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
                icon: {
                    type: "emoji",
                    name: "thumbs_up",
                    value: "👍"
                },
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
