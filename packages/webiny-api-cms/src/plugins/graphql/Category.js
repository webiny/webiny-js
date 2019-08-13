// @flow
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";

const categoryFetcher = ctx => ctx.getEntity("CmsCategory");

export default {
    typeDefs: `
        type PageBuilderCategory {
            id: ID
            createdOn: DateTime
            name: String
            slug: String
            url: String
            layout: String
        }
    
        input PageBuilderCategoryInput {
            name: String
            slug: String
            url: String
            layout: String
        }
        
        # Response types
        
        type PageBuilderCategoryResponse {
            data: PageBuilderCategory
            error: PageBuilderError
        }
        
        type PageBuilderCategoryListResponse {
            data: [PageBuilderCategory]
            meta: PageBuilderListMeta
            error: PageBuilderError
        }
        
        extend type PageBuilderQuery {
            getCategory(
                id: ID 
                where: JSON
                sort: String
            ): PageBuilderCategoryResponse
            
            listCategories(
                page: Int
                perPage: Int
                where: JSON
                sort: JSON
                search: PageBuilderSearchInput
            ): PageBuilderCategoryListResponse
        }
        
        extend type PageBuilderMutation {
            createCategory(
                data: PageBuilderCategoryInput!
            ): PageBuilderCategoryResponse
            
            updateCategory(
                id: ID!
                data: PageBuilderCategoryInput!
            ): PageBuilderCategoryResponse
        
            deleteCategory(
                id: ID!
            ): PageBuilderDeleteResponse
        }
    `,
    resolvers: {
        PageBuilderQuery: {
            getCategory: resolveGet(categoryFetcher),
            listCategories: resolveList(categoryFetcher)
        },
        PageBuilderMutation: {
            createCategory: resolveCreate(categoryFetcher),
            updateCategory: resolveUpdate(categoryFetcher),
            deleteCategory: resolveDelete(categoryFetcher)
        }
    }
};
