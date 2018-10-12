import Category from "../entities/Category/Category.entity";
import { resolveCreate, resolveDelete, resolveGet, resolveList, resolveUpdate } from "webiny-api/graphql";

export default {
    typeDefs: `
        type Category {
            id: ID,
            createdOn: DateTime,
            name: String,
            slug: String,
            url: String,
            layout: String
        }
        
        type CategoryList {
            data: [Category]
            meta: ListMeta
        }  
    `,
    queryFields: `
        getCategory(
            id: ID 
            where: JSON
            sort: String
        ): Category
        
        listCategories(
            page: Int
            perCategory: Int
            where: JSON
            sort: JSON
            search: SearchInput
        ): CategoryList
    `,
    mutationFields: `
        createCategory(
            data: JSON!
        ): Category
        
        updateCategory(
            id: ID!
            data: JSON!
        ): Category
    
        deleteCategory(
            id: ID!
        ): Boolean
    `,
    queryResolvers: {
        getCategory: resolveGet(Category),
        listCategories: resolveList(Category)
    },
    mutationResolvers: {
        createCategory: resolveCreate(Category),
        updateCategory: resolveUpdate(Category),
        deleteCategory: resolveDelete(Category)
    }
};
