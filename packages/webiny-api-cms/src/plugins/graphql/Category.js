// @flow
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";

const categoryFetcher = ctx => ctx.cms.entities.Category;

export default {
    typeDefs: `
        type Category {
            id: ID
            createdOn: DateTime
            name: String
            slug: String
            url: String
            layout: String
        }
    
        input CategoryInput {
            name: String
            slug: String
            url: String
            layout: String
        }
        
        # Response types
        
        type CategoryResponse {
            data: Category
            error: Error
        }
        
        type CategoryListResponse {
            data: [Category]
            meta: ListMeta
            error: Error
        }
        
        extend type PageBuilderQuery {
            getCategory(
                id: ID 
                where: JSON
                sort: String
            ): CategoryResponse
            
            listCategories(
                page: Int
                perPage: Int
                where: JSON
                sort: JSON
                search: SearchInput
            ): CategoryListResponse
        }
        
        extend type PageBuilderMutation {
            createCategory(
                data: CategoryInput!
            ): CategoryResponse
            
            updateCategory(
                id: ID!
                data: CategoryInput!
            ): CategoryResponse
        
            deleteCategory(
                id: ID!
            ): DeleteResponse
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
