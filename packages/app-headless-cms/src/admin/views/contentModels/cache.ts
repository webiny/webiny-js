import dotProp from "dot-prop-immutable";
import type { ApolloCache } from "@apollo/client/cache";
import type { ApolloClient } from "@apollo/client";
import type {
    ListCmsModelsQueryResponse,
    ListMenuCmsGroupsQueryResponse
} from "../../viewsGraphql.js";
import { LIST_CONTENT_MODELS, LIST_MENU_CONTENT_GROUPS_MODELS } from "../../viewsGraphql.js";
import type { CmsEditorContentModel, CmsModel } from "~/types.js";

export const addModelToListCache = (cache: ApolloCache, model: CmsEditorContentModel): void => {
    const response = cache.readQuery<ListCmsModelsQueryResponse>({
        query: LIST_CONTENT_MODELS
    });
    if (!response || !response.listContentModels) {
        return;
    }
    const { listContentModels } = response;
    const newModelIndex = listContentModels.data?.length;

    cache.writeQuery({
        query: LIST_CONTENT_MODELS,
        data: {
            listContentModels: dotProp.set(listContentModels, `data.${newModelIndex}`, model)
        }
    });
};

export const updateModelInCache = (cache: ApolloCache, model: CmsModel): void => {
    const response = cache.readQuery<ListCmsModelsQueryResponse>({
        query: LIST_CONTENT_MODELS
    });
    if (!response || !response.listContentModels?.data) {
        return;
    }

    const index = response.listContentModels.data.findIndex(m => m.modelId === model.modelId);
    if (index < 0) {
        return;
    }
    cache.writeQuery({
        query: LIST_CONTENT_MODELS,
        data: {
            listContentModels: dotProp.set(response.listContentModels, `data.${index}`, model)
        }
    });

    return updateModelInGroupCache(cache, model);
};

export const addModelToGroupCache = (cache: ApolloCache, model: CmsEditorContentModel): void => {
    const response = cache.readQuery<ListMenuCmsGroupsQueryResponse>({
        query: LIST_MENU_CONTENT_GROUPS_MODELS
    });
    if (!response || !response.listContentModelGroups) {
        return;
    }

    const { listContentModelGroups: groupsList } = response;

    const groupIndex = groupsList.data!.findIndex(g => g.slug === model.group);
    const newGroupModelIndex = groupsList.data![groupIndex].contentModels.length;

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

export const updateModelInGroupCache = (cache: ApolloCache, model: CmsModel): void => {
    const response = cache.readQuery<ListMenuCmsGroupsQueryResponse>({
        query: LIST_MENU_CONTENT_GROUPS_MODELS
    });
    if (!response || !response.listContentModelGroups) {
        return;
    }

    const { listContentModelGroups: groupsList } = response;

    const groupIndex = groupsList.data!.findIndex(g => g.slug === model.group);
    if (groupIndex < 0) {
        return;
    }
    const modelIndex = groupsList.data![groupIndex].contentModels.findIndex(
        m => m.modelId === model.modelId
    );
    if (modelIndex < 0) {
        return;
    }

    cache.writeQuery({
        query: LIST_MENU_CONTENT_GROUPS_MODELS,
        data: {
            listContentModelGroups: dotProp.set(
                groupsList,
                `data.${groupIndex}.contentModels.${modelIndex}`,
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
/**
 * TODO remove when we can confirm that new deletion works property
 */
export const removeModelFromCache = (client: ApolloClient, model: CmsEditorContentModel): void => {
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
/**
 * TODO remove when we can confirm that new deletion works property
 */
export const removeModelFromListCache = (
    cache: ApolloCache,
    model: CmsEditorContentModel
): void => {
    const response = cache.readQuery<ListCmsModelsQueryResponse>({
        query: LIST_CONTENT_MODELS
    });
    if (!response || !response.listContentModels) {
        return;
    }
    const { listContentModels } = response;
    const modelIndex = listContentModels.data!.findIndex(m => m.modelId === model.modelId);

    cache.writeQuery({
        query: LIST_CONTENT_MODELS,
        data: {
            listContentModels: dotProp.delete(listContentModels, `data.${modelIndex}`)
        }
    });
};
/**
 * TODO remove when we can confirm that new deletion works property
 */
export const removeModelFromGroupCache = (
    cache: ApolloCache,
    model: CmsEditorContentModel
): void => {
    const response = cache.readQuery<ListMenuCmsGroupsQueryResponse>({
        query: LIST_MENU_CONTENT_GROUPS_MODELS
    });
    if (!response || !response.listContentModelGroups) {
        return;
    }
    const { listContentModelGroups: groupsList } = response;

    const groupIndex = groupsList.data!.findIndex(g => g.slug === model.group);
    if (groupIndex < 0) {
        return;
    }
    const modelIndex = groupsList.data![groupIndex].contentModels.findIndex(
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
