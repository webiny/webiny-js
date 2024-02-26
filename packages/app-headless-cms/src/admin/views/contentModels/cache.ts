import dotProp from "dot-prop-immutable";
import { DataProxy } from "apollo-cache";
import ApolloClient from "apollo-client";
import {
    LIST_CONTENT_MODELS,
    LIST_MENU_CONTENT_GROUPS_MODELS,
    ListCmsModelsQueryResponse,
    ListMenuCmsGroupsQueryResponse
} from "../../viewsGraphql";
import { CmsEditorContentModel } from "~/types";

export const addModelToListCache = (cache: DataProxy, model: CmsEditorContentModel): void => {
    const response = cache.readQuery<ListCmsModelsQueryResponse>({
        query: LIST_CONTENT_MODELS
    });
    if (!response || !response.listContentModels) {
        return;
    }
    const { listContentModels } = response;
    const newModelIndex = listContentModels.data.length;

    cache.writeQuery({
        query: LIST_CONTENT_MODELS,
        data: {
            listContentModels: dotProp.set(listContentModels, `data.${newModelIndex}`, model)
        }
    });
};

export const addModelToGroupCache = (cache: DataProxy, model: CmsEditorContentModel): void => {
    const response = cache.readQuery<ListMenuCmsGroupsQueryResponse>({
        query: LIST_MENU_CONTENT_GROUPS_MODELS
    });
    if (!response || !response.listContentModelGroups) {
        return;
    }

    const { listContentModelGroups: groupsList } = response;

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

/**
 * This function is an ugly hack, but I don't know a better way to remove items from cache in Apollo Client v2.
 * When a Content Model is deleted, we need to remove it from cache, because a model can be recreated with the same
 * modelId, and it will cause problems, because Apollo will think that the data in cache belongs to this new model.
 */
export const removeModelFromCache = (
    client: ApolloClient<any>,
    model: CmsEditorContentModel
): void => {
    const id = `CmsContentModel:${model.modelId}`;

    // @ts-expect-error
    client.cache.data.delete(id);

    // @ts-expect-error
    Object.keys(client.cache.data.data).forEach(key => {
        if (key.startsWith(`${id}.`) || key.startsWith(`$${id}.`)) {
            // @ts-expect-error
            client.cache.data.delete(key);
        }
    });
};

export const removeModelFromListCache = (cache: DataProxy, model: CmsEditorContentModel): void => {
    const response = cache.readQuery<ListCmsModelsQueryResponse>({
        query: LIST_CONTENT_MODELS
    });
    if (!response || !response.listContentModels) {
        return;
    }
    const { listContentModels } = response;
    const modelIndex = listContentModels.data.findIndex(m => m.modelId === model.modelId);

    cache.writeQuery({
        query: LIST_CONTENT_MODELS,
        data: {
            listContentModels: dotProp.delete(listContentModels, `data.${modelIndex}`)
        }
    });
};

export const removeModelFromGroupCache = (cache: DataProxy, model: CmsEditorContentModel): void => {
    const response = cache.readQuery<ListMenuCmsGroupsQueryResponse>({
        query: LIST_MENU_CONTENT_GROUPS_MODELS
    });
    if (!response || !response.listContentModelGroups) {
        return;
    }
    const { listContentModelGroups: groupsList } = response;

    const groupIndex = groupsList.data.findIndex(g => g.id === model.group.id);
    if (groupIndex < 0) {
        return;
    }
    const modelIndex = groupsList.data[groupIndex].contentModels.findIndex(
        m => m.modelId === model.modelId
    );

    if (modelIndex < 0) {
        return;
    }

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
