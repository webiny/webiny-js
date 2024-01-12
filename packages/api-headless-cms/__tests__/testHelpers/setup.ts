import { CmsGroup, Icon } from "~/types";
import models from "../contentAPI/mocks/contentModels";
import { useGraphQLHandler } from "./useGraphQLHandler";
import { CmsModel } from "../types";

interface SetupContentModelParams {
    manager: ReturnType<typeof useGraphQLHandler>;
    model: CmsModel;
    group: CmsGroup;
}

export const setupContentModel = async (params: SetupContentModelParams) => {
    const { manager, model, group } = params;
    const [createResponse] = await manager.createContentModelMutation({
        data: {
            name: model.name,
            modelId: model.modelId,
            singularApiName: model.singularApiName,
            pluralApiName: model.pluralApiName,
            group: group.id
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
        process.exit(updateResponse.errors[0].message);
    } else if (updateResponse.data.updateContentModel.error) {
        console.log(`[setupContentModel] ${updateResponse.data.updateContentModel.error.message}`);
        process.exit(updateResponse.data.updateContentModel.error.message);
    }
    return updateResponse.data.updateContentModel.data;
};

export const getModel = (item: CmsModel | string): CmsModel => {
    if (typeof item === "string") {
        const model = models.find(m => m.modelId === item);
        if (!model) {
            console.log(`[setupContentModel] There is no model "${name}" defined.`);
            process.exit(1);
        }
        return model;
    }
    return item;
};

interface SetupGroupAndModelsParams {
    manager: ReturnType<typeof useGraphQLHandler>;
    models: (CmsModel | string)[];
}

export const setupGroupAndModels = async (params: SetupGroupAndModelsParams) => {
    const { manager, models } = params;
    const group = await setupContentModelGroup(manager);

    const results: CmsModel[] = [];
    for (const item of models) {
        const model = getModel(item);
        const result = await setupContentModel({
            manager,
            group,
            model
        });
        results.push(result);
    }
    return {
        models: results,
        group
    };
};

export interface SetupContentModelGroupGqlVars {
    data: {
        name: string;
        slug: string;
        icon: Icon;
        description: string;
    };
}

export const setupContentModelGroup = async (
    manager: ReturnType<typeof useGraphQLHandler>,
    vars?: SetupContentModelGroupGqlVars
): Promise<CmsGroup> => {
    if (!vars) {
        vars = {
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
        };
    }

    const [response] = await manager.createContentModelGroupMutation(vars);

    const error = response?.data?.createContentModelGroup?.error || response?.errors?.shift();
    if (error) {
        console.log("[setupContentModelGroup] could not create group");
        console.log(error.message);
        process.exit(1);
    }
    return response.data.createContentModelGroup.data;
};

export const setupContentModels = async (
    manager: ReturnType<typeof useGraphQLHandler>,
    group: CmsGroup,
    modelsList: string[]
): Promise<Record<string, any>> => {
    const items = modelsList.reduce<Record<string, any>>((acc, m) => ({ ...acc, [m]: null }), {});
    for (const name in items) {
        if (items.hasOwnProperty(name) === false) {
            continue;
        }
        const model = models.find(m => m.modelId === name);
        if (!model) {
            console.log(`[setupContentModel] There is no model "${name}" defined.`);
            process.exit(1);
        }
        items[name] = await setupContentModel({
            manager,
            group,
            model
        });
    }
    return items;
};
