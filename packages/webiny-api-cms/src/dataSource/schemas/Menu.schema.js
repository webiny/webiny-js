// @flow
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";

const menuFetcher = ctx => ctx.cms.Menu;

export default {
    typeDefs: `
        type Menu {
            id: ID
            createdBy: Author
            updatedBy: Author
            createdOn: DateTime
            name: String
            slug: String
            description: String
        }
    
        input MenuInput {
            name: String
            slug: String
            description: String
        }
        
        # Response types
        
        type MenuResponse {
            data: Menu
            error: Error
        }
        
        type MenuListResponse {
            data: [Menu]
            meta: ListMeta
            error: Error
        }
    `,
    queryFields: `
        getMenu(
            id: ID 
            where: JSON
            sort: String
        ): MenuResponse
        
        listMenus(
            page: Int
            perPage: Int
            where: JSON
            sort: JSON
            search: SearchInput
        ): MenuListResponse
    `,
    mutationFields: `
        createMenu(
            data: MenuInput!
        ): MenuResponse
        
        updateMenu(
            id: ID!
            data: MenuInput!
        ): MenuResponse
    
        deleteMenu(
            id: ID!
        ): DeleteResponse
    `,
    queryResolvers: {
        getMenu: resolveGet(menuFetcher),
        listMenus: resolveList(menuFetcher)
    },
    mutationResolvers: {
        createMenu: resolveCreate(menuFetcher),
        updateMenu: resolveUpdate(menuFetcher),
        deleteMenu: resolveDelete(menuFetcher)
    }
};
