// @flow
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";

const menuFetcher = ctx => ctx.forms.entities.Menu;
import getMenuBySlug from "./menuResolvers/getMenuBySlug";

export default {
    typeDefs: `
        type Menu {
            id: ID
            createdOn: DateTime
            title: String
            slug: String
            description: String
            items: JSON
        }
    
        input MenuInput {
            title: String
            slug: String
            description: String
            items: JSON
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
            
        extend type FormsQuery {
            getMenu(
                id: ID 
                where: JSON
                sort: String
            ): MenuResponse
            
            listMenus(
                form: Int
                perForm: Int
                where: JSON
                sort: JSON
                search: SearchInput
            ): MenuListResponse
            
            "Returns menu by given slug."
            getMenuBySlug(
                slug: String!
            ): MenuResponse
        }
        
        extend type FormsMutation {
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
        }
    `,
    resolvers: {
        FormsQuery: {
            getMenu: resolveGet(menuFetcher),
            listMenus: resolveList(menuFetcher),
            getMenuBySlug: getMenuBySlug(menuFetcher)
        },
        FormsMutation: {
            createMenu: resolveCreate(menuFetcher),
            updateMenu: resolveUpdate(menuFetcher),
            deleteMenu: resolveDelete(menuFetcher)
        }
    }
};
