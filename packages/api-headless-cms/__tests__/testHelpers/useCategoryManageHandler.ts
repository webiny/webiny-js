import type { GraphQLHandlerParams } from "./useGraphQLHandler.js";
import { useGraphQLHandler } from "./useGraphQLHandler.js";
import { getCmsModel } from "~tests/contentAPI/mocks/contentModels.js";
import {
    createCategoryFromMutation,
    createCategoryMutation,
    deleteCategoriesMutation,
    deleteCategoryMutation,
    getCategoriesByIdsQuery,
    getCategoryQuery,
    type ICreateCategoryFromMutationResponse,
    ICreateCategoryFromMutationVariables,
    type ICreateCategoryMutationResponse,
    type ICreateCategoryMutationVariables,
    type IDeleteCategoriesMutationResponse,
    type IDeleteCategoriesMutationVariables,
    type IDeleteCategoryMutationResponse,
    type IDeleteCategoryMutationVariables,
    type IGetCategoriesByIdsQueryResponse,
    IGetCategoriesByIdsQueryVariables,
    type IGetCategoryQueryResponse,
    type IGetCategoryQueryVariables,
    type IListCategoriesQueryResponse,
    type IListCategoriesQueryVariables,
    type IListDeletedCategoriesQueryResponse,
    type IListDeletedCategoriesQueryVariables,
    IMoveCategoryMutationResponse,
    IMoveCategoryMutationVariables,
    type IPublishCategoryMutationResponse,
    type IPublishCategoryMutationVariables,
    type IRepublishCategoryMutationResponse,
    type IRepublishCategoryMutationVariables,
    type IRestoreCategoryMutationResponse,
    type IRestoreCategoryMutationVariables,
    type IUnpublishCategoryMutationResponse,
    type IUnpublishCategoryMutationVariables,
    IUpdateCategoryMutationResponse,
    type IUpdateCategoryMutationVariables,
    listCategoriesQuery,
    listDeletedCategoriesQuery,
    moveCategoryMutation,
    publishCategoryMutation,
    republishCategoryMutation,
    restoreCategoryFromBinMutation,
    unpublishCategoryMutation,
    updateCategoryMutation
} from "./category/manage/index.js";
import type { IMutationParams, IQueryParams } from "./types.js";


export const useCategoryManageHandler = (params: GraphQLHandlerParams) => {
    const contentHandler = useGraphQLHandler(params);

    const model = getCmsModel("category");

    return {
        ...contentHandler,
        async getCategory(params: IQueryParams<IGetCategoryQueryVariables>) {
            return await contentHandler.invoke<IGetCategoryQueryResponse>({
                body: {
                    query: getCategoryQuery(model),
                    variables: params.variables
                },
                headers: params.headers
            });
        },
        async getCategoriesByIds(params: IQueryParams<IGetCategoriesByIdsQueryVariables>) {
            return await contentHandler.invoke<IGetCategoriesByIdsQueryResponse>({
                body: {
                    query: getCategoriesByIdsQuery(model),
                    variables: params.variables
                },
                headers: params.headers
            });
        },
        async listCategories(params?: IQueryParams<IListCategoriesQueryVariables>) {
            return await contentHandler.invoke<IListCategoriesQueryResponse>({
                body: {
                    query: listCategoriesQuery(model),
                    variables: params?.variables
                },
                headers: params?.headers
            });
        },
        async listDeletedCategories(params?: IQueryParams<IListDeletedCategoriesQueryVariables>) {
            return await contentHandler.invoke<IListDeletedCategoriesQueryResponse>({
                body: {
                    query: listDeletedCategoriesQuery(model),
                    variables: params?.variables
                },
                headers: params?.headers
            });
        },
        async createCategory(params: IMutationParams<ICreateCategoryMutationVariables>) {
            const query = createCategoryMutation(model);
            return await contentHandler.invoke<ICreateCategoryMutationResponse>({
                body: {
                    query,
                    variables: params.variables
                },
                headers: params.headers
            });
        },
        async createCategoryFrom(params: IMutationParams<ICreateCategoryFromMutationVariables>) {
            return await contentHandler.invoke<ICreateCategoryFromMutationResponse>({
                body: {
                    query: createCategoryFromMutation(model),
                    variables: params.variables
                },
                headers: params.headers
            });
        },
        async updateCategory(params: IMutationParams<IUpdateCategoryMutationVariables>) {
            return await contentHandler.invoke<IUpdateCategoryMutationResponse>({
                body: {
                    query: updateCategoryMutation(model),
                    variables: params.variables
                },
                headers: params.headers
            });
        },
        async moveCategory(params: IMutationParams<IMoveCategoryMutationVariables>) {
            return await contentHandler.invoke<IMoveCategoryMutationResponse>({
                body: {
                    query: moveCategoryMutation(model),
                    variables: params.variables
                },
                headers: params.headers
            });
        },
        async deleteCategory(params: IMutationParams<IDeleteCategoryMutationVariables>) {
            return await contentHandler.invoke<IDeleteCategoryMutationResponse>({
                body: {
                    query: deleteCategoryMutation(model),
                    variables: params.variables
                },
                headers: params.headers
            });
        },
        async restoreCategoryFromBin(params: IMutationParams<IRestoreCategoryMutationVariables>) {
            return await contentHandler.invoke<IRestoreCategoryMutationResponse>({
                body: {
                    query: restoreCategoryFromBinMutation(model),
                    variables: params.variables
                },
                headers: params.headers
            });
        },
        async deleteCategories(params: IMutationParams<IDeleteCategoriesMutationVariables>) {
            return await contentHandler.invoke<IDeleteCategoriesMutationResponse>({
                body: {
                    query: deleteCategoriesMutation(model),
                    variables: params.variables
                },
                headers: params.headers
            });
        },
        async publishCategory(params: IMutationParams<IPublishCategoryMutationVariables>) {
            return await contentHandler.invoke<IPublishCategoryMutationResponse>({
                body: {
                    query: publishCategoryMutation(model),
                    variables: params.variables
                },
                headers: params.headers
            });
        },
        async republishCategory(params: IMutationParams<IRepublishCategoryMutationVariables>) {
            return await contentHandler.invoke<IRepublishCategoryMutationResponse>({
                body: {
                    query: republishCategoryMutation(model),
                    variables: params.variables
                },
                headers: params.headers
            });
        },
        async unpublishCategory(params: IMutationParams<IUnpublishCategoryMutationVariables>) {
            return await contentHandler.invoke<IUnpublishCategoryMutationResponse>({
                body: {
                    query: unpublishCategoryMutation(model),
                    variables: params.variables
                },
                headers: params.headers
            });
        }
    };
};
