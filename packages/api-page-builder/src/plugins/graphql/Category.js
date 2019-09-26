// @flow
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "@webiny/api/graphql/commodo";

const categoryFetcher = ctx => ctx.models.PbCategory;

export default {
    typeDefs: `
        type PbCategory {
            id: ID
            createdOn: DateTime
            name: String
            slug: String
            url: String
            layout: String
        }
    
        input PbCategoryInput {
            name: String
            slug: String
            url: String
            layout: String
        }
        
        # Response types
        
        type PbCategoryResponse {
            data: PbCategory
            error: PbError
        }
        
        type PbCategoryListResponse {
            data: [PbCategory]
            meta: PbListMeta
            error: PbError
        }
        
        extend type PbQuery {
            getCategory(
                id: ID 
                where: JSON
                sort: String
            ): PbCategoryResponse
            
            listCategories(
                page: Int
                perPage: Int
                where: JSON
                sort: JSON
                search: PbSearchInput
            ): PbCategoryListResponse
        }
        
        extend type PbMutation {
            createCategory(
                data: PbCategoryInput!
            ): PbCategoryResponse
            
            updateCategory(
                id: ID!
                data: PbCategoryInput!
            ): PbCategoryResponse
        
            deleteCategory(
                id: ID!
            ): PbDeleteResponse
        }
    `,
    resolvers: {
        PbQuery: {
            getCategory: resolveGet(categoryFetcher),
            listCategories: resolveList(categoryFetcher)
        },
        PbMutation: {
            createCategory: resolveCreate(categoryFetcher),
            updateCategory: resolveUpdate(categoryFetcher),
            deleteCategory: resolveDelete(categoryFetcher)
        }
    }
};
