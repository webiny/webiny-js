// @flow
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";

const menuFetcher = ctx => ctx.cms.entities.Menu;
import getMenuBySlug from "./menuResolvers/getMenuBySlug";

export default {
    typeDefs: `
        type PageBuilderMenu {
            id: ID
            createdOn: DateTime
            title: String
            slug: String
            description: String
            items: JSON
        }
    
        input PageBuilderMenuInput {
            title: String
            slug: String
            description: String
            items: JSON
        }
        
        # Response types
        
        type PageBuilderMenuResponse {
            data: PageBuilderMenu
            error: Error
        }
        
        type PageBuilderMenuListResponse {
            data: [PageBuilderMenu]
            meta: ListMeta
            error: Error
        }
            
        extend type PageBuilderQuery {
            getMenu(
                id: ID 
                where: JSON
                sort: String
            ): PageBuilderMenuResponse
            
            listMenus(
                page: Int
                perPage: Int
                where: JSON
                sort: JSON
                search: SearchInput
            ): PageBuilderMenuListResponse
            
            "Returns menu by given slug."
            getMenuBySlug(
                slug: String!
            ): PageBuilderMenuResponse
        }
        
        extend type PageBuilderMutation {
            createMenu(
                data: PageBuilderMenuInput!
            ): PageBuilderMenuResponse
            
            updateMenu(
                id: ID!
                data: PageBuilderMenuInput!
            ): PageBuilderMenuResponse
        
            deleteMenu(
                id: ID!
            ): DeleteResponse
        }
    `,
    resolvers: {
        PageBuilderQuery: {
            getMenu: resolveGet(menuFetcher),
            listMenus: resolveList(menuFetcher),
            getMenuBySlug: getMenuBySlug(menuFetcher)
        },
        PageBuilderMutation: {
            createMenu: resolveCreate(menuFetcher),
            updateMenu: resolveUpdate(menuFetcher),
            deleteMenu: resolveDelete(menuFetcher)
        }
    }
};
