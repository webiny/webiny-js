import { CmsGroup } from "~/types";
import models from "../contentAPI/mocks/contentModels";

export const setupContentModelGroup = async (manager: any): Promise<CmsGroup> => {
    const [response] = await manager.createContentModelGroupMutation({
        data: {
            name: "Group",
            slug: "group",
            icon: "ico/ico",
            description: "description"
        }
    });
    const error = response?.data?.createContentModelGroup?.error || response?.errors?.shift();
    if (error) {
        console.log("[setupContentModelGroup] could not create group");
        console.log(error.message);
        process.exit(1);
    }
    return response.data.createContentModelGroup.data;
};

const setupContentModel = async (manager: any, contentModelGroup: CmsGroup, name: string) => {
    const model = models.find(m => m.modelId === name);
    if (!model) {
        console.log(`[setupContentModel] There is no model "${name}" defined.`);
        process.exit(1);
    }
    const [createResponse] = await manager.createContentModelMutation({
        data: {
            name: model.name,
            modelId: model.modelId,
            group: contentModelGroup.id
        }
    });

    if (createResponse.errors) {
        console.log(`[setupContentModel] ${createResponse.errors[0].message}`);
        process.exit(1);
    } else if (createResponse.data.createContentModel.error) {
        console.log(`[setupContentModel] ${createResponse.data.createContentModel.error.message}`);
        console.log(createResponse.data.createContentModel.error.message);
        process.exit(1);
    }

    const [updateResponse] = await manager.updateContentModelMutation({
        modelId: createResponse.data.createContentModel.data.modelId,
        data: {
            fields: model.fields,
            layout: model.layout
        }
    });

    if (updateResponse.errors) {
        console.log(`[setupContentModel] ${updateResponse.errors[0].message}`);
        process.exit();
    } else if (updateResponse.data.updateContentModel.error) {
        console.log(`[setupContentModel] ${updateResponse.data.updateContentModel.error.message}`);
        process.exit();
    }
    return updateResponse.data.updateContentModel.data;
};
export const setupContentModels = async (
    manager: any,
    contentModelGroup: CmsGroup,
    modelsList: string[]
): Promise<Record<string, any>> => {
    const items = modelsList.reduce<Record<string, any>>((acc, m) => ({ ...acc, [m]: null }), {});
    for (const name in items) {
        if (items.hasOwnProperty(name) === false) {
            continue;
        }
        items[name] = await setupContentModel(manager, contentModelGroup, name);
    }
    return items;
};
