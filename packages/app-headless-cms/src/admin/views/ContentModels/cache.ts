import dotProp from "dot-prop-immutable";
import * as GQL from "../../viewsGraphql";
import { CmsEditorContentModel } from "~/types";

export const addModelToListCache = (cache, model: CmsEditorContentModel) => {
    const { listContentModels } = cache.readQuery({ query: GQL.LIST_CONTENT_MODELS });
    const newModelIndex = listContentModels.data.length;

    cache.writeQuery({
        query: GQL.LIST_CONTENT_MODELS,
        data: {
            listContentModels: dotProp.set(listContentModels, `data.${newModelIndex}`, model)
        }
    });
};

export const addModelToGroupCache = (cache, model: CmsEditorContentModel) => {
    const { listContentModelGroups: groupsList } = cache.readQuery({
        query: GQL.LIST_MENU_CONTENT_GROUPS_MODELS
    });

    const groupIndex = groupsList.data.findIndex(g => g.id === model.group.id);
    const newGroupModelIndex = groupsList.data[groupIndex].contentModels.length;

    cache.writeQuery({
        query: GQL.LIST_MENU_CONTENT_GROUPS_MODELS,
        data: {
            listContentModelGroups: dotProp.set(
                groupsList,
                `data.${groupIndex}.contentModels.${newGroupModelIndex}`,
                model
            )
        }
    });
};

export const removeModelFromListCache = (cache, model: CmsEditorContentModel) => {
    const { listContentModels } = cache.readQuery({ query: GQL.LIST_CONTENT_MODELS });
    const modelIndex = listContentModels.data.findIndex(m => m.modelId === model.modelId);

    cache.writeQuery({
        query: GQL.LIST_CONTENT_MODELS,
        data: {
            listContentModels: dotProp.delete(listContentModels, `data.${modelIndex}`)
        }
    });
};

export const removeModelFromGroupCache = (cache, model: CmsEditorContentModel) => {
    const { listContentModelGroups: groupsList } = cache.readQuery({
        query: GQL.LIST_MENU_CONTENT_GROUPS_MODELS
    });

    const groupIndex = groupsList.data.findIndex(g => g.id === model.group.id);
    const modelIndex = groupsList.data[groupIndex].contentModels.findIndex(
        m => m.modelId === model.modelId
    );

    cache.writeQuery({
        query: GQL.LIST_MENU_CONTENT_GROUPS_MODELS,
        data: {
            listContentModelGroups: dotProp.delete(
                groupsList,
                `data.${groupIndex}.contentModels.${modelIndex}`
            )
        }
    });
};
