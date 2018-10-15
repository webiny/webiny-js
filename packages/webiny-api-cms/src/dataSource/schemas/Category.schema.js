import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";

const categoryFetcher = ctx => ctx.cms.Category;

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
    `,
    queryFields: `
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
    `,
    mutationFields: `
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
    `,
    queryResolvers: {
        getCategory: resolveGet(categoryFetcher),
        listCategories: resolveList(categoryFetcher)
    },
    mutationResolvers: {
        createCategory: resolveCreate(categoryFetcher),
        updateCategory: resolveUpdate(categoryFetcher),
        deleteCategory: resolveDelete(categoryFetcher)
    }
};
