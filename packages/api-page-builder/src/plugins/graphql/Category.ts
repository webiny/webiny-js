import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "@webiny/commodo-graphql";
import { hasScope } from "@webiny/api-security";
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
            getCategory: hasScope("pb:category:crud")(resolveGet(categoryFetcher)),
            listCategories: hasScope("pb:category:crud")(resolveList(categoryFetcher))
        },
        PbMutation: {
            createCategory: hasScope("pb:category:crud")(resolveCreate(categoryFetcher)),
            updateCategory: hasScope("pb:category:crud")(resolveUpdate(categoryFetcher)),
            deleteCategory: hasScope("pb:category:crud")(resolveDelete(categoryFetcher))
        }
    }
};
