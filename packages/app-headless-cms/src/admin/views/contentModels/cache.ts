import dotProp from "dot-prop-immutable";
import { LIST_CONTENT_MODELS, LIST_MENU_CONTENT_GROUPS_MODELS } from "../../viewsGraphql";
import { CmsEditorContentModel } from "~/types";
import { DataProxy } from "apollo-cache";
import { ListCmsModelsQueryResponse, ListMenuCmsGroupsQueryResponse } from "../../viewsGraphql";

export const addModelToListCache = (cache: DataProxy, model: CmsEditorContentModel): void => {
    const { listContentModels } = cache.readQuery<ListCmsModelsQueryResponse>({
        query: LIST_CONTENT_MODELS
    });
    const newModelIndex = listContentModels.data.length;

    cache.writeQuery({
        query: LIST_CONTENT_MODELS,
        data: {
            listContentModels: dotProp.set(listContentModels, `data.${newModelIndex}`, model)
        }
    });
};

export const addModelToGroupCache = (cache: DataProxy, model: CmsEditorContentModel): void => {
    const { listContentModelGroups: groupsList } = cache.readQuery<ListMenuCmsGroupsQueryResponse>({
        query: LIST_MENU_CONTENT_GROUPS_MODELS
    });

    const groupIndex = groupsList.data.findIndex(g => g.id === model.group.id);
    const newGroupModelIndex = groupsList.data[groupIndex].contentModels.length;

    cache.writeQuery({
        query: LIST_MENU_CONTENT_GROUPS_MODELS,
        data: {
            listContentModelGroups: dotProp.set(
                groupsList,
                `data.${groupIndex}.contentModels.${newGroupModelIndex}`,
                model
            )
        }
    });
};

export const removeModelFromListCache = (cache: DataProxy, model: CmsEditorContentModel): void => {
    const { listContentModels } = cache.readQuery<ListCmsModelsQueryResponse>({
        query: LIST_CONTENT_MODELS
    });
    const modelIndex = listContentModels.data.findIndex(m => m.modelId === model.modelId);

    cache.writeQuery({
        query: LIST_CONTENT_MODELS,
        data: {
            listContentModels: dotProp.delete(listContentModels, `data.${modelIndex}`)
        }
    });
};

export const removeModelFromGroupCache = (cache: DataProxy, model: CmsEditorContentModel): void => {
    const { listContentModelGroups: groupsList } = cache.readQuery<ListMenuCmsGroupsQueryResponse>({
        query: LIST_MENU_CONTENT_GROUPS_MODELS
    });

    const groupIndex = groupsList.data.findIndex(g => g.id === model.group.id);
    const modelIndex = groupsList.data[groupIndex].contentModels.findIndex(
        m => m.modelId === model.modelId
    );

    cache.writeQuery({
        query: LIST_MENU_CONTENT_GROUPS_MODELS,
        data: {
            listContentModelGroups: dotProp.delete(
                groupsList,
                `data.${groupIndex}.contentModels.${modelIndex}`
            )
        }
    });
};
